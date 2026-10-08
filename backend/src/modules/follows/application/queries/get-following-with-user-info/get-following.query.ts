import { Query } from '@nestjs/cqrs';
import { PaginatedFollowsWithUserInfo } from '@/modules/follows/domain/repositories/follow.repository.interface';

export class GetFollowingQuery extends Query<PaginatedFollowsWithUserInfo> {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}
