import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { Post } from '@/modules/posts/domain/posts/entities/post.entity';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { GetPostQuery } from './get-post.query';

@QueryHandler(GetPostQuery)
export class GetPostHandler implements IQueryHandler<GetPostQuery, Post> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(query: GetPostQuery): Promise<Post> {
    const post = await this.postRepository.findById(
      query.postId,
      query.viewerUserId,
    );
    if (!post) {
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);
    }

    // Visibility logic: Flagged posts are only visible to the author
    if (post.isFlagged && post.userId !== query.viewerUserId) {
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);
    }
    return post;
  }
}
