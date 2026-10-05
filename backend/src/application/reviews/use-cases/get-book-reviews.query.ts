import { Query } from '@nestjs/cqrs';
export class GetBookReviewsQuery extends Query<any> {
  constructor(public readonly bookId: string) { super(); }
}