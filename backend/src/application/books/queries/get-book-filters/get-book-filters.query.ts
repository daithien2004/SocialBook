import { Query } from '@nestjs/cqrs';

export class GetBookFiltersQuery extends Query<{
  genres: { id: string; name: string; slug: string; count: number }[];
  tags: { name: string; count: number }[];
}> {
  constructor() {
    super();
  }
}
