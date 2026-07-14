import { Injectable, Logger } from '@nestjs/common';
import {
  IFollowRepository,
  PaginatedFollowsWithUserInfo,
} from '@/domain/follows/repositories/follow.repository.interface';
import { GetFollowersQuery } from './get-followers.query';

@Injectable()
export class GetFollowersUseCase {
  private readonly logger = new Logger(GetFollowersUseCase.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  async execute(
    query: GetFollowersQuery,
  ): Promise<PaginatedFollowsWithUserInfo> {
    try {
      this.logger.log(`Getting followers list for user ${query.targetId}`);
      const result = await this.followRepository.findByTargetWithUserInfo(
        query.targetId,
        query.page,
        query.limit,
      );
      this.logger.log(
        `Retrieved ${result.data.length} followers for user ${query.targetId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get followers list for user ${query.targetId}`,
        error,
      );
      throw error;
    }
  }
}
