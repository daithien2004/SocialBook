import { Injectable, Logger } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import {
  ToggleLikeUseCase,
  ToggleLikeRequest,
} from '@/application/likes/use-cases/toggle-like/toggle-like.use-case';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { IBookCachePort } from '@/domain/books/interfaces/book-cache.port';
import { ToggleBookLikeCommand } from './toggle-book-like.command';

export interface ToggleBookLikeResponse {
  isLiked: boolean;
  likes: number;
}

@Injectable()
export class ToggleBookLikeUseCase {
  private readonly logger = new Logger(ToggleBookLikeUseCase.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly toggleLikeUseCase: ToggleLikeUseCase,
    private readonly bookCache: IBookCachePort,
  ) {}

  async execute(
    command: ToggleBookLikeCommand,
  ): Promise<ToggleBookLikeResponse> {
    try {
      const bookId = BookId.create(command.bookId);

      const likeRequest: ToggleLikeRequest = {
        userId: command.userId,
        targetId: command.bookId,
        targetType: TargetType.BOOK,
      };

      const likeResult = await this.toggleLikeUseCase.execute(likeRequest);

      if (likeResult.isLiked) {
        await this.bookRepository.addLike(bookId, command.userId);
      } else {
        await this.bookRepository.removeLike(bookId, command.userId);
      }

      const updatedBook = await this.bookRepository.findById(bookId);
      const newLikesCount = updatedBook?.likes ?? 0;

      this.logger.log(
        `Book ${command.bookId} like toggled by user ${command.userId}: ${likeResult.isLiked}`,
      );

      await this.bookCache.invalidateDetail(command.bookId, command.bookSlug);

      return {
        isLiked: likeResult.isLiked,
        likes: newLikesCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to toggle like for book ${command.bookId}`,
        error,
      );
      throw error;
    }
  }
}
