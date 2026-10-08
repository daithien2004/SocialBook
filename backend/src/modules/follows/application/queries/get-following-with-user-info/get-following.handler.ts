import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  IFollowRepository,
  PaginatedFollowsWithUserInfo,
} from '@/modules/follows/domain/repositories/follow.repository.interface';
import { GetFollowingQuery } from './get-following.query';

@QueryHandler(GetFollowingQuery)
export class GetFollowingHandler implements IQueryHandler<GetFollowingQuery> {
  private readonly logger = new Logger(GetFollowingHandler.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  async execute(
    query: GetFollowingQuery,
  ): Promise<PaginatedFollowsWithUserInfo> {
    try {
      this.logger.log(`Getting following list for user ${query.userId}`);
      const result = await this.followRepository.findByUserWithUserInfo(
        query.userId,
        query.page,
        query.limit,
      );
      this.logger.log(
        `Retrieved ${result.data.length} following for user ${query.userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get following list for user ${query.userId}`,
        error,
      );
      throw error;
    }
  }
}
