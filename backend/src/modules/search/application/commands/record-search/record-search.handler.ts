import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TrendingKeywordCachePort } from '@/modules/search/application/ports/trending-keyword-cache.port';
import { RecordSearchCommand } from './record-search.command';
import { ForbiddenError } from '@casl/ability';

@CommandHandler(RecordSearchCommand)
export class RecordSearchHandler implements ICommandHandler<RecordSearchCommand> {
  constructor(
    private readonly trendingKeywordCache: TrendingKeywordCachePort,
  ) {}

  async execute(command: RecordSearchCommand): Promise<void> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Search',
    );
    const keyword = command.keyword.trim().toLowerCase();
    if (keyword.length <= 2) return;
    await this.trendingKeywordCache.recordSearch(keyword);
  }
}
