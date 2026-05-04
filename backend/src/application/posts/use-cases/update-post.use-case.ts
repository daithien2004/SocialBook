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
  ) {}

  async execute(
    command: UpdatePostCommand,
    files?: Express.Multer.File[],
  ): Promise<{ post: Post; warning?: string }> {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    let moderationMessage: string | null = null;
    if (command.content) {
      const moderationResult = await this.checkContentUseCase.execute(
        command.content,
      );
      if (!moderationResult.isSafe) {
        moderationMessage =
          moderationResult.reason ||
          (moderationResult.isSpoiler
            ? '⚠️ CẢNH BÁO: Bài viết của bạn chứa nội dung tiết lộ tình tiết truyện (Spoiler). Bài viết đã được tạm ẩn để Admin kiểm duyệt.'
            : moderationResult.isToxic
              ? '🚫 VI PHẠM: Bài viết chứa ngôn từ không chuẩn mực hoặc độc hại. Bài viết đang được gửi tới Ban quản trị để xem xét.'
              : '📝 Bài viết của bạn đang được xem xét nội dung trước khi hiển thị công khai.');
        post.flag(moderationMessage);
      } else {
        post.approve();
        post.clearModeration();
      }
      post.updateContent(command.content);
    }

    if (command.bookId) {
      const bookExists = await this.bookRepository.existsById(command.bookId);
      if (!bookExists)
        throw new NotFoundDomainException(ErrorMessages.BOOK_NOT_FOUND);
      post.updateBookId(command.bookId);
    }

    if (files && files.length > 0) {
      const newImageUrls = await this.mediaService.uploadMultipleImages(files);
      post.updateImages([...post.imageUrls, ...newImageUrls]);
    }

    const updatedPost = await this.postRepository.update(post);
    return {
      post: updatedPost,
      warning: moderationMessage || undefined,
    };
  }
}
