import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { RATE_LIMIT_WINDOW_SECONDS } from '../reading-room.constants';

/**
 */
export interface RateLimitPipeline {
  set(
    key: string,
    value: number | string,
    ...rest: Array<string | number>
  ): RateLimitPipeline;
  incr(key: string): RateLimitPipeline;
  exec(): Promise<Array<[unknown, unknown]> | null>;
}

export interface RateLimitStore {
  multi(): RateLimitPipeline;
}

@Injectable()
export class WsRateLimiter {
  constructor(@InjectRedis() private readonly redis: RateLimitStore) {}

  async isLimited(
    userId: string,
    event: string,
    maxPerMinute: number,
  ): Promise<boolean> {
    const key = `rl:ws:${event}:${userId}`;
    try {
      const res = await this.redis
        .multi()
        .set(key, 0, 'EX', RATE_LIMIT_WINDOW_SECONDS, 'NX')
        .incr(key)
        .exec();
      const current = Number(res?.[1]?.[1] ?? 0);
      return current > maxPerMinute;
    } catch {
      return false;
    }
  }
}
