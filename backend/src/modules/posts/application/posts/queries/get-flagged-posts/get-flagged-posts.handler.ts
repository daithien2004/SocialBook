import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { GetFlaggedPostsQuery } from './get-flagged-posts.query';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { PostResultMapper } from '@/modules/posts/application/posts/post.result';
import type { PostResult } from '@/modules/posts/application/posts/post.result';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';

@QueryHandler(GetFlaggedPostsQuery)
export class GetFlaggedPostsHandler implements IQueryHandler<
  GetFlaggedPostsQuery,
  PaginatedResult<PostResult>
> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(
    query: GetFlaggedPostsQuery,
  ): Promise<PaginatedResult<PostResult>> {
    if (!query.actor.ability.can('manage', 'Post')) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_MODERATION_FORBIDDEN,
      );
    }
    const page = await this.postRepository.findFlagged({
      page: query.page,
      limit: query.limit,
      reason: query.reason,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy,
    });
    return { ...page, data: PostResultMapper.fromDomainArray(page.data) };
  }
}
