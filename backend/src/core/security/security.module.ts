import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from '@/shared/platform/filters/http-exception.filter';
import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { CsrfGuard } from '@/shared/platform/guards/csrf.guard';
import { CsrfMiddleware } from '@/shared/platform/middlewares/csrf.middleware';
import { UserThrottlerGuard } from './user-throttler.guard';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('{*path}');
  }
}
