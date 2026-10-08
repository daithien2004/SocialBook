// Phải đứng đầu tiên — xem worker-mode.ts. Ngoại lệ có chủ đích của thứ tự import.
import './worker-mode';

import { NestFactory } from '@nestjs/core';

import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

// Bắt lỗi toàn cục — đảm bảo stack trace xuất hiện trong Docker logs
// trước khi process thoát. Thiếu handler này thì lỗi biến mất không dấu vết.
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Worker] Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Worker] Uncaught Exception:', err.message, err.stack);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  await app.init();

  app
    .get(Logger)
    .log('Worker process started — consuming BullMQ jobs (no HTTP listener)');
}

void bootstrap();
