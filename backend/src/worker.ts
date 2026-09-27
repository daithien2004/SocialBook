// Phải đứng đầu tiên — xem worker-mode.ts. Ngoại lệ có chủ đích của thứ tự import.
import './worker-mode';

import { NestFactory } from '@nestjs/core';

import { Logger } from '@/shared/logger/logger.service';

import { AppModule } from './app.module';

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
