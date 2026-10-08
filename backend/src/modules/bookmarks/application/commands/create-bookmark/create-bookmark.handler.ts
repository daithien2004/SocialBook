import { CommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { IBookmarkRepository } from '../../../domain/repositories/bookmark.repository.interface';
import { Bookmark } from '../../../domain/entities/bookmark.entity';
import { Types } from 'mongoose';
import { CreateBookmarkCommand } from './create-bookmark.command';

@CommandHandler(CreateBookmarkCommand)
export class CreateBookmarkHandler {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute(command: CreateBookmarkCommand): Promise<Bookmark> {
    const existing = await this.bookmarkRepository.findByParagraph(
      command.userId,
      command.paragraphId,
    );
    if (existing) {
      throw new ConflictException('This paragraph is already bookmarked');
    }

    const bookmark = Bookmark.create(new Types.ObjectId().toString(), {
      userId: command.userId,
      bookId: command.bookId,
      chapterId: command.chapterId,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
      textPreview: command.textPreview,
    });

    await this.bookmarkRepository.save(bookmark);
    return bookmark;
  }
}
