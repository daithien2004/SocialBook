import { Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
import { BookListReadModel } from '@/modules/books/application/read-models/book-list.read-model';
import { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';
import type { AppAbility } from '@/shared/casl/app-ability';
import { GetTopReadBooksQuery } from './get-top-read-books.query';

@QueryHandler(GetTopReadBooksQuery)
export class GetTopReadBooksHandler implements IQueryHandler<
  GetTopReadBooksQuery,
  BookListReadModel[]
> {
  private readonly logger = new Logger(GetTopReadBooksHandler.name);

  constructor(
    private readonly bookReadRepository: BookReadRepository,
    private readonly viewRankingCache: IViewRankingCachePort,
  ) {}

  async execute(query: GetTopReadBooksQuery): Promise<BookListReadModel[]> {
    const { timeRange, limit, actor } = query;
    if (timeRange === 'all') {
      return this.getFallbackTopBooks(limit, actor.ability);
    }

    try {
      const bookIds = await this.viewRankingCache.getTopBookIds(
        timeRange,
        limit,
      );
      if (!bookIds?.length) {
        this.logger.debug(
          `No data for ${timeRange} in Redis, falling back to all-time top read.`,
        );
        return this.getFallbackTopBooks(limit, actor.ability);
      }

      const page = await this.bookReadRepository.findAllList(
        actor.ability,
        { ids: bookIds, status: 'published' },
        { page: 1, limit },
      );
      const byId = new Map(page.data.map((book) => [book.id, book]));
      return bookIds.flatMap((id) => {
        const book = byId.get(id);
        return book ? [book] : [];
      });
    } catch (error: unknown) {
      this.logger.error(
        'Error fetching top read books from Redis',
        error instanceof Error ? error.stack : String(error),
      );
      return this.getFallbackTopBooks(limit, actor.ability);
    }
  }

  private async getFallbackTopBooks(
    limit: number,
    ability: AppAbility,
  ): Promise<BookListReadModel[]> {
    const page = await this.bookReadRepository.findAllList(
      ability,
      { status: 'published' },
      { page: 1, limit },
      { sortBy: 'views', order: 'desc' },
    );
    return page.data;
  }
}
