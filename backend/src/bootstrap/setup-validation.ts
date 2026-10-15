import {
  BadRequestException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { mapValidationErrors } from '@/shared/platform/mappers/validation-error.mapper';

export function setupValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          detail: 'Request validation failed',
          errors: mapValidationErrors(errors),
        }),
    }),
  );
}
