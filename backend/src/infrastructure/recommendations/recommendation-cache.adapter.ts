import { Injectable } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { IRecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';
import { RecommendationResult } from '@/application/recommendations/dto/recommendation-result.dto';

const TTL_SECONDS = 2 * 60 * 60;

@Injectable()
export class RecommendationCacheAdapter implements IRecommendationCachePort {
  private readonly keyPrefix = 'recommendation:user:';

  constructor(private readonly cache: ICachePort) {

  }

  async get(userId: string): Promise<RecommendationResult | null> {
    return this.cache.get<RecommendationResult>(this.key(userId));
  }

  async set(userId: string, data: RecommendationResult): Promise<void> {
    await this.cache.set(this.key(userId), data, TTL_SECONDS);
  }

  async clear(userId: string): Promise<void> {
    await this.cache.del(this.key(userId));
  }

  private key(userId: string): string {
    return `${this.keyPrefix}${userId}`;
  }
}
