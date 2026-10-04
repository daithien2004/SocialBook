import { Query } from '@nestjs/cqrs';

export class GetFiltersQuery extends Query<any> {
  constructor() { super(); }
}