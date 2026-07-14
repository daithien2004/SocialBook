import { Injectable, Logger } from '@nestjs/common';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { ErrorMessages } from '@/common/constants/error-messages';
import { RemovePostImageCommand } from './remove-post-image.command';

@Injectable()
export class RemovePostImageUseCase {
  private readonly logger = new Logger(RemovePostImageUseCase.name);

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaService,
  ) {}

  async execute(command: RemovePostImageCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    if (!command.isAdmin && post.userId !== command.userId) {
      throw new ForbiddenDomainException(ErrorMessages.POST_UPDATE_FORBIDDEN);
    }

    post.removeImage(command.imageUrl);
    await this.postRepository.update(post);

    this.mediaService
      .deleteImage(command.imageUrl)
      .catch((err) => this.logger.error('Media delete error:', err));

    return { imageUrls: post.imageUrls };
  }
}
