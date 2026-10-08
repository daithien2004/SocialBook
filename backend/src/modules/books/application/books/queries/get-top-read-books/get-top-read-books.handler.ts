import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IBookQueryProvider } from '@/modules/books/domain/books/repositories/book-query.provider.interface';
import { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';
import { GetTopReadBooksQuery } from './get-top-read-books.query';
import { BookListReadModel } from '@/modules/books/domain/books/read-models/book-list.read-model';

@QueryHandler(GetTopReadBooksQuery)
export class GetTopReadBooksHandler implements IQueryHandler<
  GetTopReadBooksQuery,
  BookListReadModel[]
> {
  private readonly logger = new Logger(GetTopReadBooksHandler.name);

  constructor(
    private readonly bookQueryProvider: IBookQueryProvider,
    private readonly viewRankingCache: IViewRankingCachePort,
  ) {}

  async execute(query: GetTopReadBooksQuery): Promise<BookListReadModel[]> {
    const { timeRange, limit } = query;

    if (timeRange === 'all') {
      return this.getFallbackTopBooks(limit);
    }

    try {
      // Get top N book IDs from Redis
      const bookIds = await this.viewRankingCache.getTopBookIds(
        timeRange,
        limit,
      );

      if (!bookIds || bookIds.length === 0) {
        // Fallback to all-time top read if no data for current week/month yet
        this.logger.debug(
          `No data for ${timeRange} in Redis, falling back to all-time top read.`,
        );
        return this.getFallbackTopBooks(limit);
      }

      // Find books by IDs
      const paginated = await this.bookQueryProvider.findAllList(
        { ids: bookIds, status: 'published' },
        { page: 1, limit },
      );

      const books: BookListReadModel[] = [];
      for (const id of bookIds) {
        const book = paginated.data.find((b) => b.id.toString() === id);
        if (book) {
          books.push(book);
        }
      }

      return books;
    } catch (err) {
      this.logger.error(
        'Error fetching top read books from Redis',
        err instanceof Error ? err.stack : String(err),
      );
      return this.getFallbackTopBooks(limit);
    }
  }

  private async getFallbackTopBooks(
    limit: number,
  ): Promise<BookListReadModel[]> {
    const paginated = await this.bookQueryProvider.findAllList(
      { status: 'published' },
      { page: 1, limit },
      { sortBy: 'views', order: 'desc' },
    );
    return paginated.data;
  }
}
