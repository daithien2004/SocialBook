import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class GetTrendingKeywordsQuery extends Query<string[]> {
  constructor(
    public readonly actor: Actor,
    public readonly limit = 10,
  ) {
    super();
  }
}
