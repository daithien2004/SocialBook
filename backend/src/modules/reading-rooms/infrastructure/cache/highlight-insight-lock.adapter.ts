import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { IHighlightInsightLockPort } from '../../application/ports/external/highlight-insight-lock.port';

const HIGHLIGHT_INSIGHT_LOCK_TTL_SECONDS = 60;

const RELEASE_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

@Injectable()
export class HighlightInsightLockAdapter implements IHighlightInsightLockPort {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async tryAcquire(
    roomId: string,
    highlightId: string,
    token: string,
  ): Promise<boolean> {
    const result = await this.redis.set(
      this.key(roomId, highlightId),
      token,
      'EX',
      HIGHLIGHT_INSIGHT_LOCK_TTL_SECONDS,
      'NX',
    );
    return result === 'OK';
  }

  async release(
    roomId: string,
    highlightId: string,
    token: string,
  ): Promise<void> {
    await this.redis.eval(
      RELEASE_LOCK_SCRIPT,
      1,
      this.key(roomId, highlightId),
      token,
    );
  }

  private key(roomId: string, highlightId: string): string {
    return `insight:lock:${roomId}:${highlightId}`;
  }
}
