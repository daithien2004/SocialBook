import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { CloudinaryService } from '@/infrastructure/database/services/cloudinary.service';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class RemovePostImageUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly cloudinaryService: CloudinaryService
    ) {}

  async execute(id: string, imageUrl: string) {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    post.removeImage(imageUrl);
    await this.postRepository.update(post);

    this.cloudinaryService.deleteImage(imageUrl)
      .catch((err) => console.error('Cloudinary delete error:', err));

    return { imageUrls: post.imageUrls };
  }
}

