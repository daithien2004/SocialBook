import { Query } from '@nestjs/cqrs';

export class GetTrendingKeywordsQuery extends Query<string[]> {
  constructor(public readonly limit = 10) {
    super();
  }
}
