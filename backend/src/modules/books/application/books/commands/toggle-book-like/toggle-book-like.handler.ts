import { Inject, Logger } from '@nestjs/common';
import { ForbiddenError, subject } from '@casl/ability';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { TargetType, ToggleLikeCommand } from '@/modules/likes';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { ToggleBookLikeCommand } from './toggle-book-like.command';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import {
  INotificationQueuePort,
  LikeToggledJobPayload,
} from '@/modules/notifications/application/public-api';
import { Transactional } from '@nestjs-cls/transactional';

export interface ToggleBookLikeResult {
  isLiked: boolean;
  likes: number;
  wasCreated: boolean;
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
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(command: ToggleBookLikeCommand): Promise<ToggleBookLikeResult> {
    try {
      const result = await this.toggleBookLikeInTransaction(command);

      this.logger.log(
        `Book ${command.bookId} like toggled by user ${command.userId}: ${result.isLiked}`,
      );

      if (result.wasCreated) {
        try {
          await this.notificationQueue.queueLikeToggled(
            new LikeToggledJobPayload(
              command.userId,
              command.bookId,
              TargetType.BOOK,
              true,
            ),
          );
        } catch (error: unknown) {
          this.logger.error(
            `Failed to queue like notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
      await this.bookCache.invalidateDetail(command.bookId, command.bookSlug);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to toggle like for book ${command.bookId}`,
        error,
      );
      throw error;
    }
  }

  @Transactional()
  private async toggleBookLikeInTransaction(
    command: ToggleBookLikeCommand,
  ): Promise<ToggleBookLikeResult> {
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
      new ToggleLikeCommand(
        command.actor,
        command.bookId,
        TargetType.BOOK,
        true,
      ),
    );
    if (likeResult.isLiked) {
      await this.bookRepository.addLike(bookId, command.userId);
    } else {
      await this.bookRepository.removeLike(bookId, command.userId);
    }

    const updatedBook = await this.bookRepository.findById(bookId);
    return {
      isLiked: likeResult.isLiked,
      likes: updatedBook?.likes ?? 0,
      wasCreated: likeResult.wasCreated,
    };
  }
}
