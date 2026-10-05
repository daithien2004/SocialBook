import { Query } from '@nestjs/cqrs';
import { Follow } from '@/domain/follows/entities/follow.entity';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

export class GetFollowsQuery extends Query<PaginatedResult<Follow>> {
  constructor(
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
