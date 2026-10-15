import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { PostModerationService } from '../../services/post-moderation.service';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { UpdatePostCommand } from './update-post.command';
import { subject } from '@casl/ability';
import type { Post as PostEntity } from '@/modules/posts/domain/posts/entities/post.entity';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<
  UpdatePostCommand,
  string
> {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaPort,
    private readonly bookRepository: IBookRepository,
    private readonly postModerationService: PostModerationService,
  ) {}

  async execute(command: UpdatePostCommand): Promise<string> {
    const post = await this.postRepository.findById(command.postId);
    if (!post)
      throw new NotFoundDomainException(PostErrorMessages.POST_NOT_FOUND);

    if (
      !command.actor.ability.can('update', subject('Post', postSubject(post)))
    ) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_UPDATE_FORBIDDEN,
      );
    }

    if (command.content) {
      await this.postModerationService.moderate(
        command.actor,
        post,
        command.content,
      );
      post.updateContent(command.content);
    }

    if (command.bookId) {
      const bookExists = await this.bookRepository.existsById(command.bookId);
      if (!bookExists)
        throw new NotFoundDomainException(PostErrorMessages.BOOK_NOT_FOUND);
      post.updateBookId(command.bookId);
    }

    if (command.imageUrls !== undefined) {
      let urls: string[] = [];
      if (Array.isArray(command.imageUrls)) {
        urls = command.imageUrls.filter((url) => url && url.trim() !== '');
      }
      post.updateImages(urls);
    }

    if (command.files && command.files.length > 0) {
      const newImageUrls = await this.mediaService.uploadMultipleImages(
        command.files,
      );
      post.updateImages([...post.imageUrls, ...newImageUrls]);
    }

    return this.persistPost(post);
  }

  @Transactional()
  private async persistPost(post: PostEntity): Promise<string> {
    const updatedPost = await this.postRepository.update(post);
    return updatedPost.id;
  }
}

function postSubject(post: PostEntity) {
  return {
    id: post.id,
    userId: post.userId,
    isDeleted: post.isDeleted,
    isFlagged: post.isFlagged,
  };
}
