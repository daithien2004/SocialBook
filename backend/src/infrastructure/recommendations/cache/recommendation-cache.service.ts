import { Injectable, Logger } from '@nestjs/common';
import { RecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';
import { RecommendationResponse } from '@/domain/recommendations/interfaces/recommendation.interface';

const TTL_MS = 2 * 60 * 60 * 1000;

interface CacheEntry {
  data: RecommendationResponse;
  timestamp: number;
}

@Injectable()
export class RecommendationCacheService extends RecommendationCachePort {
  private readonly logger = new Logger(RecommendationCacheService.name);
  private readonly cache = new Map<string, CacheEntry>();

  async get(userId: string): Promise<RecommendationResponse | null> {
    const entry = this.cache.get(userId);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > TTL_MS) {
      this.cache.delete(userId);
      return null;
    }
    return entry.data;
  }

  async set(userId: string, data: RecommendationResponse): Promise<void> {
    this.cache.set(userId, { data, timestamp: Date.now() });
  }

  async clear(userId: string): Promise<void> {
    this.cache.delete(userId);
  }
}
