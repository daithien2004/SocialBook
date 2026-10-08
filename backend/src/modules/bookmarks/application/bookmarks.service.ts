import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Bookmark } from '../domain/entities/bookmark.entity';
import { IBookmarkRepository } from '../domain/repositories/bookmark.repository.interface';

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarkRepository: IBookmarkRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async create(input: {
    userId: string;
    bookId: string;
    chapterId: string;
    chapterSlug: string;
    paragraphId: string;
    textPreview: string;
  }): Promise<Bookmark> {
    const existing = await this.bookmarkRepository.findByParagraph(
      input.userId,
      input.paragraphId,
    );
    if (existing) {
      throw new ConflictException('This paragraph is already bookmarked');
    }

    const bookmark = Bookmark.create(this.idGenerator.generate(), input);
    await this.bookmarkRepository.save(bookmark);
    return bookmark;
  }

  async delete(userId: string, paragraphId: string): Promise<void> {
    const existing = await this.bookmarkRepository.findByParagraph(
      userId,
      paragraphId,
    );
    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.deleteByParagraph(userId, paragraphId);
  }

  findByBook(userId: string, bookId: string): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByBook(userId, bookId);
  }
}
