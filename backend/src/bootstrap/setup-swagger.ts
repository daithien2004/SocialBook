import type { INestApplication } from '@nestjs/common';
import { configSwagger } from '@/core/config/swagger.config';

export function setupSwagger(app: INestApplication, nodeEnv: string): void {
  if (nodeEnv !== 'production') {
    configSwagger(app);
  }
}
