import { Module } from '@nestjs/common';
import { CacheInfrastructureModule } from '@/core/redis/cache/cache-infrastructure.module';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { RateLimitConfigService } from './ai-rate-limit.service';

@Module({
  imports: [CacheInfrastructureModule, PostgresDatabaseModule],
  providers: [RateLimitConfigService],
  exports: [RateLimitConfigService],
})
export class RateLimitConfigModule {}
