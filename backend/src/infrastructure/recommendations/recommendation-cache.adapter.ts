import { Injectable } from '@nestjs/common';
import { ICachePort } from '@/domain/shared/interfaces/cache.port';
import { IRecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';
import { RecommendationResponse } from '@/domain/recommendations/interfaces/recommendation.interface';

const TTL_SECONDS = 2 * 60 * 60;

@Injectable()
export class RecommendationCacheAdapter implements IRecommendationCachePort {
  private readonly keyPrefix = 'recommendation:user:';

  constructor(private readonly cache: ICachePort) {

  }

  async get(userId: string): Promise<RecommendationResponse | null> {
    return this.cache.get<RecommendationResponse>(this.key(userId));
  }

  async set(userId: string, data: RecommendationResponse): Promise<void> {
    await this.cache.set(this.key(userId), data, TTL_SECONDS);
  }

  async clear(userId: string): Promise<void> {
    await this.cache.del(this.key(userId));
  }

  private key(userId: string): string {
    return `${this.keyPrefix}${userId}`;
  }
}
