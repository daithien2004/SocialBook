import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { UpdatePostCommand } from './update-post.command';

@Injectable()
export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaService,
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly bookRepository: IBookRepository,
  ) { }

  async execute(command: UpdatePostCommand, files?: Express.Multer.File[]): Promise<Post> {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    // Check ownership if needed or handled by controller/guard. 
    // Assuming command.userId is trustworthy (from JWT). 
    // Logic: if not admin, must be owner. 
    // But currently logic just finds post. 

    if (command.content) {
      const moderationResult = await this.checkContentUseCase.execute(command.content);
      if (!moderationResult.isSafe) {
        const reason = moderationResult.reason || 'Nội dung không phù hợp';
        post.flag(reason);
      } else {
        post.approve();
        post.clearModeration();
      }
      post.updateContent(command.content);
    }

    if (command.bookId) {
      const bookExists = await this.bookRepository.existsById(command.bookId);
      if (!bookExists) throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
      post.updateBookId(command.bookId);
    }

    if (files && files.length > 0) {
      const newImageUrls = await this.mediaService.uploadMultipleImages(files);
      post.updateImages([...post.imageUrls, ...newImageUrls]);
    }

    return this.postRepository.update(post);
  }
}
