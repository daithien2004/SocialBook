import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { CreatePostCommand } from './create-post.command';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaService,
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    command: CreatePostCommand,
    files?: Express.Multer.File[],
  ): Promise<{ post: Post; warning?: string }> {
    // Validate Book
    const bookExists = await this.bookRepository.existsById(command.bookId);
    if (!bookExists)
      throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);

    // Content Moderation
    const moderationResult = await this.checkContentUseCase.execute(
      command.content,
    );

    // Upload Images
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.mediaService.uploadMultipleImages(files);
    }

    // Prepare Post Entity
    const post = Post.create({
      id: this.idGenerator.generate(),
      userId: command.userId,
      bookId: command.bookId,
      content: command.content,
      imageUrls,
    });

    // Apply Moderation Flags
    let moderationMessage: string | null = null;
    if (!moderationResult.isSafe) {
      moderationMessage =
        moderationResult.reason ||
        (moderationResult.isSpoiler
          ? '⚠️ CẢNH BÁO: Bài viết của bạn chứa nội dung tiết lộ tình tiết truyện (Spoiler). Bài viết đã được tạm ẩn để Admin kiểm duyệt.'
          : moderationResult.isToxic
            ? '🚫 VI PHẠM: Bài viết chứa ngôn từ không chuẩn mực hoặc độc hại. Bài viết đang được gửi tới Ban quản trị để xem xét.'
            : '📝 Bài viết của bạn đang được xem xét nội dung trước khi hiển thị công khai.');
      post.flag(moderationMessage);
    }

    // Save
    const createdPost = await this.postRepository.create(post);

    return {
      post: createdPost,
      warning: moderationMessage || undefined,
    };
  }
}
