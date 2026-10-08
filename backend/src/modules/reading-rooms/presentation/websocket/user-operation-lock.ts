import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';
import { ConcurrencyException } from '@/shared/domain/common-exceptions';

const USER_LOCK_TTL_MS = 15_000;
const USER_LOCK_WAIT_MS = 10_000;
const USER_LOCK_RETRY_MS = 40;

const RELEASE_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

@Injectable()
export class UserOperationLock {
  private readonly logger = new Logger(UserOperationLock.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async runExclusive<T>(
    userId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = `lock:user:${userId}`;
    const token = randomUUID();
    const deadline = Date.now() + USER_LOCK_WAIT_MS;

    while (Date.now() < deadline) {
      const acquired = await this.redis.set(
        key,
        token,
        'PX',
        USER_LOCK_TTL_MS,
        'NX',
      );
      if (acquired === 'OK') {
        try {
          return await operation();
        } finally {
          try {
            await this.redis.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
          } catch (error) {
            this.logger.error(
              `Failed to release user operation lock for ${userId}`,
              error instanceof Error ? error.stack : String(error),
            );
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, USER_LOCK_RETRY_MS));
    }

    throw new ConcurrencyException('Timed out waiting for user operation lock');
  }
}
