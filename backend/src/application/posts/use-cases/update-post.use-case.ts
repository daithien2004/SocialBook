import { Injectable } from '@nestjs/common';
import { ForbiddenDomainException, NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { PostModerationService } from '../services/post-moderation.service';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { UpdatePostCommand } from './update-post.command';

@Injectable()
export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly mediaService: IMediaService,
    private readonly bookRepository: IBookRepository,
    private readonly postModerationService: PostModerationService,
  ) {}

  async execute(
    command: UpdatePostCommand,
    files?: Express.Multer.File[],
  ): Promise<{ post: Post; moderationMessage?: string }> {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.POST_NOT_FOUND);

    if (post.userId !== command.userId) {
      throw new ForbiddenDomainException(ErrorMessages.POST_UPDATE_FORBIDDEN);
    }

    let moderationMessage: string | undefined;

    if (command.content) {
      moderationMessage = await this.postModerationService.moderate(
        post,
        command.content,
      );
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
      moderationMessage,
    };
  }
}
