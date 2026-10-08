import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import type { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';

function getISOWeek(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

@Injectable()
export class ViewRankingCacheAdapter implements IViewRankingCachePort {
  private readonly logger = new Logger(ViewRankingCacheAdapter.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private monthKey(now: Date): string {
    return `views:monthly:${now.getFullYear().toString()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private weekKey(now: Date): string {
    return `views:weekly:${now.getFullYear().toString()}-W${String(getISOWeek(now)).padStart(2, '0')}`;
  }

  async recordView(bookId: string): Promise<void> {
    try {
      const now = new Date();
      const monthKey = this.monthKey(now);
      const weekKey = this.weekKey(now);

      await Promise.all([
        this.redis.zincrby(monthKey, 1, bookId),
        this.redis.zincrby(weekKey, 1, bookId),
      ]);
    } catch (err) {
      this.logger.error(
        `Failed to record book view in Redis: ${bookId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async getTopBookIds(
    timeRange: 'weekly' | 'monthly',
    limit: number,
  ): Promise<string[]> {
    try {
      const now = new Date();
      const key =
        timeRange === 'weekly' ? this.weekKey(now) : this.monthKey(now);

      return await this.redis.zrevrange(key, 0, limit - 1);
    } catch (err) {
      this.logger.error(
        'Failed to fetch top books from Redis',
        err instanceof Error ? err.stack : String(err),
      );
      return [];
    }
  }
}
