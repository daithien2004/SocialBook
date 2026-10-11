import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
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
                ? {}
                : undefined,
            connectTimeout: 10000,
            maxRetriesPerRequest: 5,
            retryStrategy: (times: number) => {
              if (times > 5) {
                new Logger('RedisConnectionModule').error(
                  '[Redis] Connection failed after 5 retries. Redis features will be disabled.',
                );
                return null;
              }
              return Math.min(times * 500, 2000);
            },
            reconnectOnError: (err: Error) =>
              ['READONLY', 'ECONNRESET', 'ETIMEDOUT'].some((target) =>
                err.message.includes(target),
              ),
          },
        };
      },
    }),
  ],
  exports: [RedisModule],
})
export class RedisConnectionModule {}
