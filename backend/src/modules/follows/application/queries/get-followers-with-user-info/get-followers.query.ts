import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { FollowWithUserInfoResult } from '../../follow.result';

export class GetFollowersQuery extends Query<
  PageResult<FollowWithUserInfoResult>
> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}
