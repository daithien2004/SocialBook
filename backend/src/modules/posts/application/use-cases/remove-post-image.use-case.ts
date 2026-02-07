import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { CloudinaryService } from '../../../cloudinary/infrastructure/services/cloudinary.service';
import { ErrorMessages } from '@/src/common/constants/error-messages';

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
