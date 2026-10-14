import { Module } from '@nestjs/common';
import { CacheInfrastructureModule } from '@/core/redis/cache/cache-infrastructure.module';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { RateLimitConfigService } from './ai-rate-limit.service';
import { AIRateLimitConfigPort } from '../../application/ports/ai-rate-limit-config.port';

@Module({
  imports: [CacheInfrastructureModule, PostgresDatabaseModule],
  providers: [
    RateLimitConfigService,
    { provide: AIRateLimitConfigPort, useExisting: RateLimitConfigService },
  ],
  exports: [RateLimitConfigService, AIRateLimitConfigPort],
})
export class RateLimitConfigModule {}
