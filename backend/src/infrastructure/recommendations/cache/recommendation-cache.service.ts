import { Inject, Injectable } from '@nestjs/common';
import { CACHE_SERVICE } from '@/domain/shared/interfaces/cache.service.interface';
import type { ICacheService } from '@/domain/shared/interfaces/cache.service.interface';
import { RecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';
import { RecommendationResponse } from '@/domain/recommendations/interfaces/recommendation.interface';

const TTL_SECONDS = 2 * 60 * 60;

@Injectable()
export class RecommendationCacheService extends RecommendationCachePort {
  private readonly keyPrefix = 'recommendation:user:';

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cache: ICacheService,
  ) {
    super();
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
