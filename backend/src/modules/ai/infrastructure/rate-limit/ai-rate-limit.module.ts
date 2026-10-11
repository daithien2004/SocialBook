import { Module } from '@nestjs/common';
import { CacheInfrastructureModule } from '@/core/redis/cache/cache-infrastructure.module';
import { RateLimitConfigService } from './ai-rate-limit.service';

@Module({
  imports: [CacheInfrastructureModule],
  providers: [RateLimitConfigService],
  exports: [RateLimitConfigService],
})
export class RateLimitConfigModule {}
