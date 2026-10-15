import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class GetTrendingBooksQuery extends Query<
  { bookId: string; title: string; coverImage: string | null; score: number }[]
> {
  constructor(
    public readonly actor: Actor,
    public readonly days?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
