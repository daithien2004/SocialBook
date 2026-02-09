import { Injectable, NotFoundException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { CloudinaryService } from '@/infrastructure/external/cloudinary.service';
import { ErrorMessages } from '@/common/constants/error-messages';
import { RemovePostImageCommand } from './remove-post-image.command';

@Injectable()
export class RemovePostImageUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  async execute(command: RemovePostImageCommand) {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    post.removeImage(command.imageUrl);
    await this.postRepository.update(post);

    this.cloudinaryService.deleteImage(command.imageUrl)
      .catch((err) => console.error('Cloudinary delete error:', err));

    return { imageUrls: post.imageUrls };
  }
}
