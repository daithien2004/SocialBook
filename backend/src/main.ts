import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lấy ConfigService từ application context
  const configService = app.get(ConfigService);

  // Sử dụng ConfigService để lấy các biến môi trường
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3000',
  );
  const port = configService.get<number>('PORT', 5000);

  // Đặt tiền tố toàn cục 'api' cho tất cả các route trong ứng dụng
  // Ví dụ: Các endpoint sẽ có dạng /api/resource thay vì /resource
  app.setGlobalPrefix('api');

  // Cấu hình ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
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

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Khởi động server
  await app.listen(port);
  console.log(`Backend running on ${await app.getUrl()}`);
}
bootstrap();
