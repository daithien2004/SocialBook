import { Module } from '@nestjs/common';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { RedisConnectionModule } from '../redis/redis-connection.module';

@Module({
  imports: [
    RedisConnectionModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisConnectionModule],
      inject: [getRedisConnectionToken()],
      useFactory: (redis: Redis) => ({
        throttlers: [{ name: 'global', ttl: 60_000, limit: 100 }],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    PinoLoggerModule.forRoot({
      pinoHttp: {
        genReqId: (request, response) => {
          const header = request.headers['x-request-id'];
          const requestId =
            typeof header === 'string' && /^[a-zA-Z0-9._-]{1,128}$/.test(header)
              ? header
              : randomUUID();
          response.setHeader('x-request-id', requestId);
          return requestId;
        },
        customProps: (request) => ({ traceId: request.id }),
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers.x-csrf-token',
            'req.body.password',
            'req.body.refreshToken',
            'req.body.accessToken',
            'req.body.token',
          ],
          remove: true,
        },
        ...(process.env.NODE_ENV !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: { colorize: true },
              },
            }
          : {}),
      },
    }),
  ],
  exports: [ThrottlerModule, PinoLoggerModule],
})
export class LoggingModule {}
