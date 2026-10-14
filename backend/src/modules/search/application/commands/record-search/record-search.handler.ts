import { CommandHandler } from '@nestjs/cqrs';
import { TrendingKeywordCachePort } from '@/modules/search/application/ports/trending-keyword-cache.port';
import { RecordSearchCommand } from './record-search.command';

@CommandHandler(RecordSearchCommand)
export class RecordSearchHandler {
  constructor(
    private readonly trendingKeywordCache: TrendingKeywordCachePort,
  ) {}

  async execute(command: RecordSearchCommand): Promise<void> {
    const keyword = command.keyword.trim().toLowerCase();
    if (keyword.length <= 2) return;
    await this.trendingKeywordCache.recordSearch(keyword);
  }
}
