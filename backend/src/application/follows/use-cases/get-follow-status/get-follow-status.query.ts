import { Query } from '@nestjs/cqrs';
export class GetFollowStatusQuery extends Query<any> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
  ) {
    super();}
}
