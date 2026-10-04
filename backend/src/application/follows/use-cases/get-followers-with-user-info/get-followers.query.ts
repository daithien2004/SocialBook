import { Query } from '@nestjs/cqrs';
export class GetFollowersQuery extends Query<any> {
  constructor(
    public readonly targetId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();}
}
