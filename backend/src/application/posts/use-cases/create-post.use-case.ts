import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { CloudinaryService } from '@/infrastructure/external/cloudinary.service';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { CreatePostCommand } from './create-post.command';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly bookRepository: IBookRepository,
  ) { }

  async execute(command: CreatePostCommand, files?: Express.Multer.File[]): Promise<Post> {
    // Validate Book
    const bookExists = await this.bookRepository.existsById(command.bookId);
    if (!bookExists) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    // Content Moderation
    const moderationResult = await this.checkContentUseCase.execute(command.content);

    // Upload Images
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    // Prepare Post Entity
    const post = Post.create({
      userId: command.userId,
      bookId: command.bookId,
      content: command.content,
      imageUrls
    });

    // Apply Moderation Flags
    if (!moderationResult.isSafe) {
      const reason = moderationResult.reason ||
        (moderationResult.isSpoiler ? 'Phát hiện nội dung spoiler' :
          moderationResult.isToxic ? 'Phát hiện nội dung độc hại' :
            'Nội dung không phù hợp');
      post.flag(reason);
    }

    // Save
    const createdPost = await this.postRepository.create(post);
    return createdPost;
  }
}
