import { Global, Module } from '@nestjs/common';
import { CacheInfrastructureModule } from '@/infrastructure/cache/cache-infrastructure.module';
import { RateLimitConfigService } from './rate-limit-config.service';

@Global()
@Module({
  imports: [CacheInfrastructureModule],
  providers: [RateLimitConfigService],
  exports: [RateLimitConfigService],
})
export class RateLimitConfigModule {}
