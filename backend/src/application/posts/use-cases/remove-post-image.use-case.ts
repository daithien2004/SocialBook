import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { ErrorMessages } from '@/common/constants/error-messages';
import { RemovePostImageCommand } from './remove-post-image.command';

@Injectable()
export class RemovePostImageUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaService,
  ) {}

  async execute(command: RemovePostImageCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    post.removeImage(command.imageUrl);
    await this.postRepository.update(post);

    this.mediaService
      .deleteImage(command.imageUrl)
      .catch((err) => console.error('Media delete error:', err));

    return { imageUrls: post.imageUrls };
  }
}
