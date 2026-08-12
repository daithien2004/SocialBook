import { Injectable, ConflictException } from '@nestjs/common';
import { IBookmarkRepository } from '@/domain/bookmarks/repositories/bookmark.repository.interface';
import { Bookmark } from '@/domain/bookmarks/entities/bookmark.entity';
import { Types } from 'mongoose';
import { CreateBookmarkCommand } from './create-bookmark.command';

@Injectable()
export class CreateBookmarkUseCase {
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
