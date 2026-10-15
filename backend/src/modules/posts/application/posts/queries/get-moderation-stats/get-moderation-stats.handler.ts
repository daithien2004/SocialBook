import { GetModerationStatsQuery } from './get-moderation-stats.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import type { PostModerationStatsResult } from '@/modules/posts/application/posts/post.result';

@QueryHandler(GetModerationStatsQuery)
export class GetModerationStatsHandler implements IQueryHandler<
  GetModerationStatsQuery,
  PostModerationStatsResult
> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(
    query: GetModerationStatsQuery,
  ): Promise<PostModerationStatsResult> {
    if (!query.actor.ability.can('manage', 'Post')) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_MODERATION_FORBIDDEN,
      );
    }
    return this.postRepository.getModerationStats();
  }
}
