import { Module } from '@nestjs/common';
import { RateLimitConfigModule } from '../infrastructure/rate-limit/public-api';
import { AIThrottleGuard } from './ai-throttle.guard';

@Module({
  imports: [RateLimitConfigModule],
  providers: [AIThrottleGuard],
  exports: [AIThrottleGuard],
})
export class AIThrottleModule {}
