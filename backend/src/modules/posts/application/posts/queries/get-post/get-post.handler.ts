import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { GetPostQuery } from './get-post.query';
import { subject } from '@casl/ability';
import { PostResultMapper } from '@/modules/posts/application/posts/post.result';
import type { PostResult } from '@/modules/posts/application/posts/post.result';

@QueryHandler(GetPostQuery)
export class GetPostHandler implements IQueryHandler<GetPostQuery, PostResult> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(query: GetPostQuery): Promise<PostResult> {
    const post = await this.postRepository.findById(
      query.postId,
      query.actor.userId,
    );
    if (!post) {
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);
    }

    // Visibility logic: Flagged posts are only visible to the author
    if (
      !query.actor.ability.can(
        'read',
        subject('Post', {
          id: post.id,
          userId: post.userId,
          isDeleted: post.isDeleted,
          isFlagged: post.isFlagged,
        }),
      )
    ) {
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);
    }
    return PostResultMapper.fromDomain(post);
  }
}
