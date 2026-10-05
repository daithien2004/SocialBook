import { CommonModule } from '@/application/common/common.module';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { LoggerModule } from '@/shared/logger/logger.module';
import { getRedisConnectionToken, RedisModule } from '@nestjs-modules/ioredis';
import { Logger, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { CsrfMiddleware } from '@/common/middlewares/csrf.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { isWorkerProcess } from '@/common/utils/process-role.util';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envConfig } from './config';
import { validateEnv } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Clean Architecture Modules
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    CommonModule,
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
        // Worker cần null để BLPOP blocking hoạt động đúng.
        // API phải fail-fast (2 lần) khi redis-queue sập — tránh treo vô hạn làm chết API.
        const isWorker = process.env.WORKER_MODE === 'true';
        return {
          connection: {
            host: configService.get<string>('env.BULL_REDIS_HOST', 'localhost'),
            port: configService.get<number>('env.BULL_REDIS_PORT', 6379),
            password: configService.get<string>('env.BULL_REDIS_PASSWORD'),
            maxRetriesPerRequest: isWorker ? null : 2,
            // API không tích trữ lệnh trong RAM khi Redis sập — trả 503 ngay lập tức.
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
    // A8: cron chỉ chạy ở tiến trình worker (đúng 1 replica). Nếu đăng ký ở mọi
    // replica API thì mỗi @Cron sẽ bắn N lần — đối soát đơn hàng sẽ chạy trùng.
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
