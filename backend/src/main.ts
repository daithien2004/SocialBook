import { json, urlencoded, Application as ExpressApplication } from 'express';
import { Logger } from '@/shared/logger/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './presentation/gateways/redis-io.adapter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { configSwagger } from './config/swagger.config';

async function bootstrap() {
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

  app.enableCors({
    origin,
    credentials: true,
  });

  // Use Redis-backed Socket.IO adapter for horizontal scaling
  const redisHost = configService.get<string>('env.REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('env.REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('env.REDIS_PASSWORD', '');
  const redisUrl = redisPassword
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}/2`
    : `redis://${redisHost}:${redisPort}/2`;

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(redisUrl);
  app.useWebSocketAdapter(redisIoAdapter);

  app.useGlobalInterceptors(new TransformInterceptor());

  configSwagger(app);

  // Enable graceful shutdown hooks (important for BullMQ and database connections)
  app.enableShutdownHooks();

  // Start the server
  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`Backend running on ${await app.getUrl()}`);
}
void bootstrap();
