import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { CloudinaryService } from '@/infrastructure/external/cloudinary.service';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { CreatePostDto } from '../../../presentation/posts/dto/create-post.dto';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(userId: string, dto: CreatePostDto, files?: Express.Multer.File[]): Promise<Post> {
    // Validate Book
    const bookExists = await this.bookRepository.existsById(dto.bookId);
    if (!bookExists) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    // Content Moderation
    const moderationResult = await this.checkContentUseCase.execute(dto.content);
    
    // Upload Images
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
    }

    // Prepare Post Entity
    const post = Post.create({
        userId,
        bookId: dto.bookId,
        content: dto.content,
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

