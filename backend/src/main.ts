import {
  json,
  urlencoded,
  Application as ExpressApplication,
  Request,
  Response,
  NextFunction,
} from 'express';
import { Logger } from '@/shared/logger/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './presentation/gateways/redis-io.adapter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { configSwagger } from './config/swagger.config';
import { isWorkerProcess } from './common/utils/process-role.util';
import { POST_MODERATION_QUEUE } from './infrastructure/queues/post-moderation/post-moderation.processor';
import { CHAPTERS_IMPORT_QUEUE } from './infrastructure/queues/chapters-import/chapters-import.processor';

async function bootstrap() {
  // A7: entry point của API không bao giờ được chạy ở worker mode. Nếu không có
  // chốt này, một biến WORKER_MODE lạc trong env dùng chung sẽ biến mọi replica
  // API thành worker: mất NotificationWorker (realtime chết im lặng) và đăng ký
  // trùng các consumer trả phí. Ở đây nó nổ to thay vì hỏng âm thầm.
  if (isWorkerProcess()) {
    throw new Error(
      'main.ts (API entry) must not run with WORKER_MODE=true — use dist/worker.js',
    );
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.use(helmet());

  // Increase payload size limits for JSON and URL-encoded bodies (e.g., for large book imports)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Get ConfigService from the application context
  const configService = app.get(ConfigService);

  // Use ConfigService to read environment variables
  const frontendUrl = configService.get<string>(
    'env.FRONTEND_URL',
    'http://localhost:3000',
  );
  const port = configService.get<number>('env.PORT', 5000);

  // Set global prefix 'api' for all routes
  app.setGlobalPrefix('api');

  // Configure ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure cookie-parser
  app.use(cookieParser());
  const expressApp = app.getHttpAdapter().getInstance() as ExpressApplication;
  expressApp.set('trust proxy', 1);

  // Configure CORS
  const origin = frontendUrl.includes(',')
    ? frontendUrl.split(',').map((url) => url.trim())
    : frontendUrl;
  
  const origins = Array.isArray(origin) ? origin : [origin];
  origins.push('https://admin.socket.io'); // Phục vụ Mục 10: Giám sát Socket

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Use Redis-backed Socket.IO adapter for horizontal scaling
  const redisHost = configService.get<string>('env.REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('env.REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('env.REDIS_PASSWORD', '');
  const redisUrl = redisPassword
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
    : `redis://${redisHost}:${redisPort}`;

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(redisUrl);
  app.useWebSocketAdapter(redisIoAdapter);

  app.useGlobalInterceptors(new TransformInterceptor());

  configSwagger(app);

  // Mục 6: Bull Board — giao diện giám sát queue cho Admin nội bộ.
  // Truy cập tại /queues (BasicAuth bảo vệ, không cần JWT).
  const bullBoardAdapter = new ExpressAdapter();
  bullBoardAdapter.setBasePath('/queues');

  const bullRedisConnection = {
    host: configService.get<string>('env.BULL_REDIS_HOST', 'localhost'),
    port: configService.get<number>('env.BULL_REDIS_PORT', 6379),
    password: configService.get<string>('env.BULL_REDIS_PASSWORD') || undefined,
  };

  createBullBoard({
    queues: [
      new BullMQAdapter(
        new Queue(POST_MODERATION_QUEUE, { connection: bullRedisConnection }),
      ),
      new BullMQAdapter(
        new Queue(CHAPTERS_IMPORT_QUEUE, { connection: bullRedisConnection }),
      ),
    ],
    serverAdapter: bullBoardAdapter,
  });

  const bullBoardUser = configService.get<string>(
    'env.BULL_BOARD_USER',
    'admin',
  );
  const bullBoardPass = configService.get<string>(
    'env.BULL_BOARD_PASSWORD',
    '',
  );

  expressApp.use(
    '/queues',
    (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
        res.sendStatus(401);
        return;
      }
      const decoded = Buffer.from(auth.slice(6), 'base64').toString();
      const colonIndex = decoded.indexOf(':');
      const user = decoded.slice(0, colonIndex);
      const pass = decoded.slice(colonIndex + 1);
      if (user !== bullBoardUser || pass !== bullBoardPass) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
        res.sendStatus(401);
        return;
      }
      next();
    },
    bullBoardAdapter.getRouter() as Parameters<typeof expressApp.use>[1],
  );

  // Enable graceful shutdown hooks (important for BullMQ and database connections)
  app.enableShutdownHooks();

  // Start the server
  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`Backend running on ${await app.getUrl()}`);
}
void bootstrap();
