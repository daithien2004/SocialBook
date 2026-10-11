import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from '@/shared/platform/filters/http-exception.filter';
import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { CsrfGuard } from '@/shared/platform/guards/csrf.guard';
import { CsrfMiddleware } from '@/shared/platform/middlewares/csrf.middleware';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('{*path}');
  }
}
