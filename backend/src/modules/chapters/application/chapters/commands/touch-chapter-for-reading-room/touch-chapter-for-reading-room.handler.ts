import { CommandHandler } from '@nestjs/cqrs';
import type { ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/modules/chapters/domain/chapters/value-objects/book-id.vo';
import { ChapterId } from '@/modules/chapters/domain/chapters/value-objects/chapter-id.vo';
import { TouchChapterForReadingRoomCommand } from './touch-chapter-for-reading-room.command';

@CommandHandler(TouchChapterForReadingRoomCommand)
export class TouchChapterForReadingRoomHandler implements ICommandHandler<
  TouchChapterForReadingRoomCommand,
  string | null
> {
  constructor(private readonly chapterRepository: IChapterRepository) {}

  @Transactional()
  execute(command: TouchChapterForReadingRoomCommand): Promise<string | null> {
    return this.chapterRepository.touchIfInBook(
      ChapterId.create(command.chapterId),
      BookId.create(command.bookId),
    );
  }
}
