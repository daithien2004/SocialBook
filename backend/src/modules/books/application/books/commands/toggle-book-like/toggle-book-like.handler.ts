import { Logger } from '@nestjs/common';
import { ForbiddenError, subject } from '@casl/ability';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { TargetType, ToggleLikeCommand } from '@/modules/likes';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { ToggleBookLikeCommand } from './toggle-book-like.command';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

export interface ToggleBookLikeResult {
  isLiked: boolean;
  likes: number;
}

@CommandHandler(ToggleBookLikeCommand)
export class ToggleBookLikeHandler implements ICommandHandler<
  ToggleBookLikeCommand,
  ToggleBookLikeResult
> {
  private readonly logger = new Logger(ToggleBookLikeHandler.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly commandBus: CommandBus,
    private readonly bookCache: IBookCachePort,
  ) {}

  async execute(command: ToggleBookLikeCommand): Promise<ToggleBookLikeResult> {
    try {
      const bookId = BookId.create(command.bookId);
      const book = await this.bookRepository.findById(bookId);
      if (!book) {
        throw new NotFoundDomainException('Book not found');
      }
      ForbiddenError.from(command.actor.ability).throwUnlessCan(
        'like',
        subject('Book', {
          id: book.id.toString(),
          status: book.status.toString(),
          isDeleted: false,
        }),
      );

      const likeResult = await this.commandBus.execute(
        new ToggleLikeCommand(command.userId, command.bookId, TargetType.BOOK),
      );

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
