import { Global, Module } from '@nestjs/common';
import { CoreConfigModule } from './config/core-config.module';
import { DatabaseModule } from './database/database.module';
import { MongoPersistenceModule } from './database/mongo-persistence.module';
import { RedisConnectionModule } from './redis/redis-connection.module';
import { CacheInfrastructureModule } from './redis/cache/cache-infrastructure.module';
import { QueueConnectionModule } from './queue/queue-connection.module';
import { LoggingModule } from './logging/logging.module';
import { HealthModule } from './health/health.module';
import { SecurityModule } from './security/security.module';
import { CoreRuntimeModule } from './runtime/core-runtime.module';

@Global()
@Module({
  imports: [
    CoreConfigModule,
    DatabaseModule,
    MongoPersistenceModule,
    RedisConnectionModule,
    CacheInfrastructureModule,
    QueueConnectionModule,
    LoggingModule,
    CoreRuntimeModule,
    SecurityModule,
    HealthModule,
  ],
  exports: [
    CoreConfigModule,
    DatabaseModule,
    MongoPersistenceModule,
    RedisConnectionModule,
    CacheInfrastructureModule,
    QueueConnectionModule,
    LoggingModule,
    CoreRuntimeModule,
    SecurityModule,
  ],
})
export class CoreModule {}
