import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { IMediaPort } from '@/modules/media/domain/public-api';
import { ErrorMessages } from '@/common/constants/error-messages';
import { RemovePostImageCommand } from './remove-post-image.command';

import { Action, Subject } from '@socialbook/shared';
import { subject } from '@casl/ability';

@CommandHandler(RemovePostImageCommand)
export class RemovePostImageHandler implements ICommandHandler<
  RemovePostImageCommand,
  { imageUrls: string[] }
> {
  private readonly logger = new Logger(RemovePostImageHandler.name);

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaPort,
  ) {}

  async execute(command: RemovePostImageCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    if (!command.ability.can(Action.Update, subject(Subject.Post, post))) {
      throw new ForbiddenDomainException(ErrorMessages.POST_UPDATE_FORBIDDEN);
    }

    post.removeImage(command.imageUrl);
    await this.postRepository.update(post);

    this.mediaService.deleteImage(command.imageUrl).catch((err) => {
      this.logger.error('Media delete error:', err);
    });

    return { imageUrls: post.imageUrls };
  }
}
