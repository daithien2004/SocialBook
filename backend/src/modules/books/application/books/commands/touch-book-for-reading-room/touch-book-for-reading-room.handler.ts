import { CommandHandler } from '@nestjs/cqrs';
import type { ICommandHandler } from '@nestjs/cqrs';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { TouchBookForReadingRoomCommand } from './touch-book-for-reading-room.command';

@CommandHandler(TouchBookForReadingRoomCommand)
export class TouchBookForReadingRoomHandler implements ICommandHandler<
  TouchBookForReadingRoomCommand,
  boolean
> {
  constructor(private readonly bookRepository: IBookRepository) {}

  execute(command: TouchBookForReadingRoomCommand): Promise<boolean> {
    return this.bookRepository.touchIfActive(BookId.create(command.bookId));
  }
}
