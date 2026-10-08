import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { LoggerModule } from '@/shared/logger/logger.module';
import { getRedisConnectionToken, RedisModule } from '@nestjs-modules/ioredis';
import { Logger, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from '@/shared/platform/guards/csrf.guard';
import { CsrfMiddleware } from '@/shared/platform/middlewares/csrf.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envConfig } from './config';
import { validateEnv } from './config/env.validation';
import { HttpExceptionFilter } from './shared/platform/filters/http-exception.filter';

// Clean Architecture Modules
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validate:
        process.env.SKIP_ENV_VALIDATION === 'true' ? undefined : validateEnv,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'env.MONGO_URI',
          'mongodb://localhost:27017/socialbook',
        ),
      }),
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('env.REDIS_HOST', 'localhost');
        const port = configService.get<number>('env.REDIS_PORT', 6379);
        const password = configService.get<string>('env.REDIS_PASSWORD');

        return {
          type: 'single',
          options: {
            host,
            port,
            password,
            db: 0,
            tls:
              host.includes('upstash') || host.includes('rediss')
                ? { rejectUnauthorized: false }
                : undefined,
            connectTimeout: 10000,
            maxRetriesPerRequest: 5,
            retryStrategy: (times: number) => {
              if (times > 5) {
                new Logger(AppModule.name).error(
                  '[Redis] Connection failed after 5 retries. Redis features will be disabled.',
                );
                return null;
              }
              return Math.min(times * 500, 2000);
            },
            reconnectOnError: (err) => {
              const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
              if (targetErrors.some((e) => err.message.includes(e))) {
                return true;
              }
              return false;
            },
          },
        };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Worker cáº§n null Ä‘á»ƒ BLPOP blocking hoáº¡t Ä‘á»™ng Ä‘Ãºng.
        // API pháº£i fail-fast (2 láº§n) khi redis-queue sáº­p â€” trÃ¡nh treo vÃ´ háº¡n lÃ m cháº¿t API.
        const isWorker = process.env.WORKER_MODE === 'true';
        return {
          connection: {
            host: configService.get<string>('env.BULL_REDIS_HOST', 'localhost'),
            port: configService.get<number>('env.BULL_REDIS_PORT', 6379),
            password: configService.get<string>('env.BULL_REDIS_PASSWORD'),
            maxRetriesPerRequest: isWorker ? null : 2,
            // API khÃ´ng tÃ­ch trá»¯ lá»‡nh trong RAM khi Redis sáº­p â€” tráº£ 503 ngay láº­p tá»©c.
            enableOfflineQueue: isWorker,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [getRedisConnectionToken()],
      useFactory: (redis: Redis) => ({
        throttlers: [
          {
            name: 'global',
            ttl: 60_000,
            limit: 100,
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    EventEmitterModule.forRoot({ verboseMemoryLeak: true }),
    // A8: cron chá»‰ cháº¡y á»Ÿ tiáº¿n trÃ¬nh worker (Ä‘Ãºng 1 replica). Náº¿u Ä‘Äƒng kÃ½ á»Ÿ má»i
    // replica API thÃ¬ má»—i @Cron sáº½ báº¯n N láº§n â€” Ä‘á»‘i soÃ¡t Ä‘Æ¡n hÃ ng sáº½ cháº¡y trÃ¹ng.
    ...(isWorkerProcess() ? [ScheduleModule.forRoot()] : []),
    CqrsModule.forRoot(),
    LoggerModule,
    // Clean Architecture - 3 layers
    InfrastructureModule,
    ApplicationModule,
    PresentationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('{*path}');
  }
}
