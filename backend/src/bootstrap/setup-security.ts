import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

export function parseOrigins(frontendUrl: string): string[] {
  return frontendUrl.split(',').map((origin) => origin.trim());
}

export function setupSecurity(
  app: NestExpressApplication,
  frontendUrl: string,
): void {
  app.use(helmet());
  app.use(cookieParser());
  app.set('trust proxy', 1);

  app.enableCors({
    origin: parseOrigins(frontendUrl),
    credentials: true,
  });
}
