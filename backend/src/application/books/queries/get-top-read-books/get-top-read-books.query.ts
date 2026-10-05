import { Query } from '@nestjs/cqrs';
import { IBookQueryProvider } from "@/domain/books/repositories/book-query.provider.interface";
import { IViewRankingCachePort } from "@/domain/books/interfaces/view-ranking-cache.port";
import { BookListReadModel } from "@/domain/books/read-models/book-list.read-model";

export class GetTopReadBooksQuery extends Query<BookListReadModel[]> {
  constructor(
    public readonly timeRange: 'weekly' | 'monthly' | 'all',
    public readonly limit: number = 5,
  ) { super(); }
}
