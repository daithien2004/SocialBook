import { Query } from '@nestjs/cqrs';

export class GetTrendingBooksQuery extends Query<
  { bookId: string; title: string; coverImage: string | null; score: number }[]
> {
  constructor(
    public readonly days?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
