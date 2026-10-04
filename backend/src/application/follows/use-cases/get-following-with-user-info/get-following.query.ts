import { Query } from '@nestjs/cqrs';
export class GetFollowingQuery extends Query<any> {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();}
}
