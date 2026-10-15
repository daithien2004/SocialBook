import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { RedisIoAdapter } from '@/core/redis/redis-io.adapter';

interface RedisConnectionConfig {
  host: string;
  port: number;
  password: string;
}

function buildRedisUrl({
  host,
  port,
  password,
}: RedisConnectionConfig): string {
  const credentials = password ? `:${encodeURIComponent(password)}@` : '';
  return `redis://${credentials}${host}:${port.toString()}`;
}

export async function setupWebSocket(
  app: INestApplication,
  config: ConfigService,
): Promise<void> {
  const redisUrl = buildRedisUrl({
    host: config.getOrThrow<string>('env.REDIS_HOST'),
    port: config.getOrThrow<number>('env.REDIS_PORT'),
    password: config.getOrThrow<string>('env.REDIS_PASSWORD'),
  });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(redisUrl);
  app.useWebSocketAdapter(redisIoAdapter);
}
