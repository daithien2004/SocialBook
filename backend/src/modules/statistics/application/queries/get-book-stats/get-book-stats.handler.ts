import { GetBookStatsQuery } from './get-book-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { BookStats } from '@/modules/statistics/domain/read-models/statistics.model';

@QueryHandler(GetBookStatsQuery)
export class GetBookStatsHandler {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async execute(): Promise<BookStats> {
    const [total, totalChapters, byGenre, popularBooksResult] =
      await Promise.all([
        this.bookRepository.countTotal(),
        this.chapterRepository.countTotal(),
        this.bookRepository.countByGenreName(),
        this.bookRepository.findPopular({ page: 1, limit: 10 }),
      ]);

    return {
      total,
      totalChapters,
      byGenre: byGenre.map((g) => ({ genres: g.name, count: g.count })),
      popularBooks: popularBooksResult.data.map((book) => ({
        id: book.id.toString(),
        title: book.title.toString(),
        slug: book.slug,
        stats: {
          views: book.views,
          likes: book.likes,
        },
      })),
    };
  }
}
