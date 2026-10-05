import { Query } from '@nestjs/cqrs';
import { IFollowRepository, PaginatedFollowsWithUserInfo } from "@/domain/follows/repositories/follow.repository.interface";

export class GetFollowersQuery extends Query<PaginatedFollowsWithUserInfo> {
  constructor(
    public readonly targetId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();}
}
