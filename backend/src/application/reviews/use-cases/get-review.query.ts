import { Query } from '@nestjs/cqrs';

export class GetReviewQuery extends Query<any> {
  constructor() { super(); }
}
