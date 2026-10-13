import { Global, Module } from '@nestjs/common';
import { CoreConfigModule } from './config/core-config.module';
import { PostgresDatabaseModule } from './database/postgres/postgres-database.module';
import { RedisConnectionModule } from './redis/redis-connection.module';
import { CacheInfrastructureModule } from './redis/cache/cache-infrastructure.module';
import { QueueConnectionModule } from './queue/queue-connection.module';
import { LoggingModule } from './logging/logging.module';
import { HealthModule } from './health/health.module';
import { SecurityModule } from './security/security.module';
import { CoreRuntimeModule } from './runtime/core-runtime.module';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaService } from './database/postgres/prisma.service';

@Global()
@Module({
  imports: [
    CoreConfigModule,
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          imports: [PostgresDatabaseModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
            sqlFlavor: 'postgresql',
          }),
        }),
      ],
    }),
    PostgresDatabaseModule,
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
    PostgresDatabaseModule,
    RedisConnectionModule,
    CacheInfrastructureModule,
    QueueConnectionModule,
    LoggingModule,
    CoreRuntimeModule,
    SecurityModule,
  ],
})
export class CoreModule {}
