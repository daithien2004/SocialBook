import { Injectable, Logger } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { IRecommendationCachePort } from '@/modules/recommendations/domain/interfaces/recommendation-cache.port';
import { RecommendationResult } from '@/modules/recommendations/domain/interfaces/recommendation-result';

const TTL_SECONDS = 2 * 60 * 60;

@Injectable()
export class RecommendationCacheAdapter implements IRecommendationCachePort {
  private readonly keyPrefix = 'recommendation:user:';
  private readonly logger = new Logger(RecommendationCacheAdapter.name);

  constructor(private readonly cache: ICachePort) {}

  async get(userId: string): Promise<RecommendationResult | null> {
    return this.cache.get<RecommendationResult>(this.key(userId));
  }

  async set(userId: string, data: RecommendationResult): Promise<void> {
    try {
      await this.cache.set(this.key(userId), data, TTL_SECONDS);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to set recommendation cache for user ${userId}: ${reason}`,
      );
    }
  }

  async clear(userId: string): Promise<void> {
    try {
      await this.cache.del(this.key(userId));
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to clear recommendation cache for user ${userId}: ${reason}`,
      );
    }
  }

  private key(userId: string): string {
    return `${this.keyPrefix}${userId}`;
  }
}
