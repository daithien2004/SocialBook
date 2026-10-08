import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import {
  FreshTokens,
  TokenRotationPort,
} from '@/modules/auth/application/public-api';

const LOCK_TTL_MS = 5_000;

function isFreshTokens(value: unknown): value is FreshTokens {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    typeof value.accessToken === 'string' &&
    'refreshToken' in value &&
    typeof value.refreshToken === 'string'
  );
}

@Injectable()
export class TokenRotationAdapter implements TokenRotationPort {
  private readonly logger = new Logger(TokenRotationAdapter.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private lockKey(userId: string): string {
    return `auth:refresh-lock:${userId}`;
  }

  private tokensKey(userId: string): string {
    return `auth:fresh-tokens:${userId}`;
  }

  async tryAcquireLock(userId: string): Promise<boolean> {
    try {
      const result = await this.redis.set(
        this.lockKey(userId),
        '1',
        'PX',
        LOCK_TTL_MS,
        'NX',
      );
      return result === 'OK';
    } catch (error) {
      this.logger.error(
        `Failed to acquire refresh lock for user "${userId}": ${getErrorMessage(error)}`,
      );
      return false;
    }
  }

  async writeFreshTokens(
    userId: string,
    tokens: FreshTokens,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.redis.setex(
        this.tokensKey(userId),
        ttlSeconds,
        JSON.stringify(tokens),
      );
    } catch (error) {
      this.logger.error(
        `Failed to write fresh tokens for user "${userId}": ${getErrorMessage(error)}`,
      );
    }
  }

  async readFreshTokens(userId: string): Promise<FreshTokens | null> {
    try {
      const raw = await this.redis.get(this.tokensKey(userId));
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isFreshTokens(parsed)) return null;
      return parsed;
    } catch (error) {
      this.logger.error(
        `Failed to read fresh tokens for user "${userId}": ${getErrorMessage(error)}`,
      );
      return null;
    }
  }

  async releaseLock(userId: string): Promise<void> {
    try {
      await this.redis.del(this.lockKey(userId));
    } catch (error) {
      this.logger.error(
        `Failed to release refresh lock for user "${userId}": ${getErrorMessage(error)}`,
      );
    }
  }

  async revokeAll(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.redis.del(this.lockKey(userId)),
        this.redis.del(this.tokensKey(userId)),
      ]);
    } catch (error) {
      this.logger.error(
        `Failed to revoke refresh family for user "${userId}": ${getErrorMessage(error)}`,
      );
    }
  }
}
