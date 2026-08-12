import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import type { ITrendingKeywordCache } from '@/domain/search/interfaces/trending-keyword.cache.interface';

@Injectable()
export class TrendingKeywordCacheService implements ITrendingKeywordCache {
  private readonly logger = new Logger(TrendingKeywordCacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async recordSearch(keyword: string): Promise<void> {
    const cleanKeyword = keyword.trim().toLowerCase();
    if (cleanKeyword.length <= 2) return;

    const today = new Date().toISOString().slice(0, 10);
    const bucketKey = `trending:searches:${today}`;
    const TTL_SECONDS = 8 * 24 * 3600;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.zincrby(bucketKey, 1, cleanKeyword);
      pipeline.expire(bucketKey, TTL_SECONDS, 'NX');
      await pipeline.exec();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to increment trending search for keyword: ${cleanKeyword} - ${errorMessage}`,
      );
    }
  }

  async getTrendingKeywords(limit = 10): Promise<string[]> {
    const bucketKeys: string[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      bucketKeys.push(`trending:searches:${d.toISOString().slice(0, 10)}`);
    }

    try {
      const existingKeys = (
        await Promise.all(
          bucketKeys.map((k) =>
            this.redis.exists(k).then((v) => (v ? k : null)),
          ),
        )
      ).filter((k): k is string => k !== null);

      if (existingKeys.length === 0) return [];

      const tempKey = `trending:searches:temp:${Date.now()}`;
      try {
        await this.redis.zunionstore(
          tempKey,
          existingKeys.length,
          ...existingKeys,
        );
        return await this.redis.zrevrange(tempKey, 0, limit - 1);
      } finally {
        await this.redis.del(tempKey).catch(() => undefined);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to fetch trending keywords from Redis: ${errorMessage}`,
      );
      return [];
    }
  }
}
