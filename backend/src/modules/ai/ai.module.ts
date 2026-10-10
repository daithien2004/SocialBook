import { Module } from '@nestjs/common';
import { AIApplicationModule } from './application/ai-application.module';
import { AIController } from './presentation/ai.controller';
import { AdminRateLimitController } from './presentation/admin-rate-limit.controller';
import { AIThrottleModule } from './presentation/ai-throttle.module';
import { RateLimitConfigModule } from './infrastructure/rate-limit/public-api';

@Module({
  imports: [AIApplicationModule, AIThrottleModule, RateLimitConfigModule],
  controllers: [AIController, AdminRateLimitController],
})
export class AIModule {}
