import { json, urlencoded } from 'express';
import { Logger } from '@/shared/logger/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './infrastructure/gateways/redis-io.adapter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
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

  // Lấy ConfigService từ application context
  const configService = app.get(ConfigService);

  // Sử dụng ConfigService để lấy các biến môi trường
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3000',
  );
  const port = configService.get<number>('env.PORT', 5000);

  // Đặt tiền tố toàn cục 'api' cho tất cả các route trong ứng dụng
  app.setGlobalPrefix('api');

  // Cấu hình ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cấu hình cookie-parser
  app.use(cookieParser());

  // Cấu hình CORS
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
    ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
    : `redis://${redisHost}:${redisPort}`;

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(redisUrl);
  app.useWebSocketAdapter(redisIoAdapter);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  configSwagger(app);

  // Khởi động server
  await app.listen(port, '0.0.0.0');
  const logger = app.get(Logger);
  logger.log(`Backend running on ${await app.getUrl()}`);
}
bootstrap();
