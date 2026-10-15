import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { RemovePostImageCommand } from './remove-post-image.command';

import { subject } from '@casl/ability';
import type { Post as PostEntity } from '@/modules/posts/domain/posts/entities/post.entity';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(RemovePostImageCommand)
export class RemovePostImageHandler implements ICommandHandler<
  RemovePostImageCommand,
  void
> {
  private readonly logger = new Logger(RemovePostImageHandler.name);

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaPort,
  ) {}

  async execute(command: RemovePostImageCommand) {
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

    post.removeImage(command.imageUrl);
    await this.persistPost(post);

    this.mediaService.deleteImage(command.imageUrl).catch((err) => {
      this.logger.error('Media delete error:', err);
    });
  }

  @Transactional()
  private async persistPost(post: PostEntity): Promise<void> {
    await this.postRepository.update(post);
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
