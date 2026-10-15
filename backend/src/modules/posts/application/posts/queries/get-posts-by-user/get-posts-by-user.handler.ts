import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { CursorPaginatedResult } from '@/shared/domain/pagination.types';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { GetPostsByUserQuery } from './get-posts-by-user.query';
import { PostResultMapper } from '@/modules/posts/application/posts/post.result';
import type { PostResult } from '@/modules/posts/application/posts/post.result';

@QueryHandler(GetPostsByUserQuery)
export class GetPostsByUserHandler implements IQueryHandler<
  GetPostsByUserQuery,
  CursorPaginatedResult<PostResult>
> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(
    query: GetPostsByUserQuery,
  ): Promise<CursorPaginatedResult<PostResult>> {
    const { userId, limit, cursor } = query;
    if (!userId) throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    const page = await this.postRepository.findAll({
      limit,
      cursor,
      userId,
      viewerUserId:
        query.actor.userId === 'anonymous' ? undefined : query.actor.userId,
    });
    return { ...page, data: PostResultMapper.fromDomainArray(page.data) };
  }
}
