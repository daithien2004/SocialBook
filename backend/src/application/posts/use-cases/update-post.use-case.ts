import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { CloudinaryService } from '@/infrastructure/external/cloudinary.service';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { UpdatePostDto } from '../../../presentation/posts/dto/update-post.dto';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(id: string, userId: string, dto: UpdatePostDto, files?: Express.Multer.File[]): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundException(ErrorMessages.POST_NOT_FOUND);

    if (dto.content) {
        const moderationResult = await this.checkContentUseCase.execute(dto.content);
        if (!moderationResult.isSafe) {
            const reason = moderationResult.reason || 'Nội dung không phù hợp';
            post.flag(reason);
        } else {
            post.approve();
            post.isFlagged = false;
            post.moderationReason = undefined;
            post.moderationStatus = undefined;
        }
        post.updateContent(dto.content);
    }

    if (dto.bookId) {
        const bookExists = await this.bookRepository.existsById(dto.bookId);
        if (!bookExists) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
        post.bookId = dto.bookId;
    }

    if (files && files.length > 0) {
        const newImageUrls = await this.cloudinaryService.uploadMultipleImages(files);
        post.updateImages([...post.imageUrls, ...newImageUrls]);
    }

    return this.postRepository.update(post);
  }
}

