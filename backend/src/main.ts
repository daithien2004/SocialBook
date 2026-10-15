// This side-effect import must precede AppModule and all feature imports.
import './api-mode';

import { Logger } from 'nestjs-pino';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupBodyParsers } from './bootstrap/setup-body-parsers';
import { setupSecurity } from './bootstrap/setup-security';
import { setupSwagger } from './bootstrap/setup-swagger';
import { setupValidation } from './bootstrap/setup-validation';
import { setupWebSocket } from './bootstrap/setup-websocket';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  setupSecurity(app, config.getOrThrow<string>('env.FRONTEND_URL'));
  setupBodyParsers(app);
  setupValidation(app);
  await setupWebSocket(app, config);
  setupSwagger(app, config.getOrThrow<string>('env.NODE_ENV'));

  app.enableShutdownHooks();
  await app.listen(config.getOrThrow<number>('env.PORT'), '0.0.0.0');

  app.get(Logger).log(`Backend running on ${await app.getUrl()}`);
}

void bootstrap();
