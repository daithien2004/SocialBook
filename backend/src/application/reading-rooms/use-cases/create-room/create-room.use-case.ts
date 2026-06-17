import { Injectable } from '@nestjs/common';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { CreateRoomCommand } from './create-room.command';
import { ReadingRoomResult } from '../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';

@Injectable()
export class CreateRoomUseCase {
  constructor(
    private readonly roomRepository: IReadingRoomRepository,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async execute(command: CreateRoomCommand): Promise<ReadingRoomResult> {
    const book = await this.bookRepository.findById(
      BookId.create(command.bookId),
    );
    if (!book) {
      throw new NotFoundDomainException('Sách không tồn tại');
    }

    const firstChapter = await this.chapterRepository.findFirstChapter(
      BookId.create(command.bookId),
    );
    if (!firstChapter) {
      throw new BadRequestDomainException(
        'Sách chưa có chương nào, không thể tạo phòng đọc',
      );
    }

    const room = ReadingRoom.create({
      bookId: command.bookId,
      hostId: command.hostId,
      mode: command.mode,
      maxMembers: command.maxMembers || 10,
      currentChapterSlug: firstChapter.slug,
    });

    await this.roomRepository.save(room);
    return ReadingRoomApplicationMapper.toResult(room);
  }
}
