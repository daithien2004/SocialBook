import { Query } from '@nestjs/cqrs';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { Actor } from '@/shared/casl/actor';
import type { FollowResult } from '../../follow.result';

export class GetFollowsQuery extends Query<PageResult<FollowResult>> {
  constructor(
    public readonly actor: Actor,
    public readonly userId?: string,
    public readonly targetId?: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly sortBy?: 'createdAt' | 'updatedAt',
    public readonly order?: 'asc' | 'desc',
  ) {
    super();
  }
}
