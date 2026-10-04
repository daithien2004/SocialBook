import { Query } from '@nestjs/cqrs';
export class GetAuthorsQuery extends Query<any> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly name?: string,
    public readonly bio?: string,
  ) {
    super();}
}
