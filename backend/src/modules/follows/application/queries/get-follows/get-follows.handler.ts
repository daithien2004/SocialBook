import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import type {
  PageResult,
  PaginatedResult,
} from '@/shared/domain/pagination.types';
import { GetFollowsQuery } from './get-follows.query';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { FollowResultMapper } from '../../follow.result';
import { Follow } from '@/modules/follows/domain/entities/follow.entity';
import type { FollowResult } from '../../follow.result';

@QueryHandler(GetFollowsQuery)
export class GetFollowsHandler implements IQueryHandler<GetFollowsQuery> {
  private readonly logger = new Logger(GetFollowsHandler.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  async execute(query: GetFollowsQuery) {
    try {
      if (!query.actor.ability.can('read', 'Follow')) {
        throw new ForbiddenDomainException('FOLLOW_READ_FORBIDDEN');
      }
      const pagination = {
        page: query.page || 1,
        limit: query.limit || 10,
      };

      const sort = {
        sortBy: query.sortBy || 'createdAt',
        order: query.order || 'desc',
      };

      let domainPage: PaginatedResult<Follow>;

      if (query.userId) {
        const userId = UserId.create(query.userId);
        domainPage = await this.followRepository.findByUser(
          userId,
          pagination,
          sort,
        );
      } else if (query.targetId) {
        const targetId = TargetId.create(query.targetId);
        domainPage = await this.followRepository.findByTarget(
          targetId,
          pagination,
          sort,
        );
      } else {
        domainPage = await this.followRepository.findAll({}, pagination, sort);
      }

      const result: PageResult<FollowResult> = {
        items: FollowResultMapper.fromDomainArray(domainPage.data),
        total: domainPage.meta.total,
      };
      this.logger.log(`Retrieved ${result.items.length} follows`);

      return result;
    } catch (error) {
      this.logger.error('Failed to get follows', error);
      throw error;
    }
  }
}
