import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { CursorPaginatedResult } from '@/shared/domain/pagination.types';
import { Post } from '@/modules/posts/domain/posts/entities/post.entity';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { GetPostsByUserQuery } from './get-posts-by-user.query';

@QueryHandler(GetPostsByUserQuery)
export class GetPostsByUserHandler implements IQueryHandler<
  GetPostsByUserQuery,
  CursorPaginatedResult<Post>
> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(
    query: GetPostsByUserQuery,
  ): Promise<CursorPaginatedResult<Post>> {
    const { userId, limit, cursor, viewerUserId } = query;
    if (!userId) throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    return this.postRepository.findAll({ limit, cursor, userId, viewerUserId });
  }
}
