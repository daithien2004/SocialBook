import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CacheModule } from '@/shared/cache/redis.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MailerModule } from '@nestjs-modules/mailer';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envConfig } from './config';

// Clean Architecture Modules
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
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
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('env.EMAIL_USER'),
            pass: configService.get<string>('env.EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('env.EMAIL_USER')}>`,
        },
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
            tls:
              host !== 'localhost' ? { rejectUnauthorized: false } : undefined,
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
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('env.REDIS_HOST', 'localhost'),
          port: configService.get<number>('env.REDIS_PORT', 6379),
          password: configService.get<string>('env.REDIS_PASSWORD'),
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    EventEmitterModule.forRoot(),
    CacheModule,
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
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
