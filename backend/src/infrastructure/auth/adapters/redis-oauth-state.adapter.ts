import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { OAuthStateStorePort } from '@/application/ports/oauth-state-store.port';
import { OAuthFlowState } from '@/domain/auth/tokens/oauth-state.vo';

const TTL_SECONDS = 300;

@Injectable()
export class RedisOAuthStateAdapter implements OAuthStateStorePort {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  private key(state: string): string {
    return `auth:oauth:state:${state}`;
  }

  async create(state: string, data: OAuthFlowState): Promise<void> {
    await this.redis.setex(this.key(state), TTL_SECONDS, JSON.stringify(data));
  }

  async consume(state: string): Promise<OAuthFlowState | null> {
    const raw = await this.redis.get(this.key(state));
    if (!raw) return null;
    await this.redis.del(this.key(state));
    return JSON.parse(raw) as OAuthFlowState;
  }

  async remove(state: string): Promise<void> {
    await this.redis.del(this.key(state));
  }
}
