import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { Injectable } from '@nestjs/common';
import { GetLibraryQuery } from './get-library.query';

@Injectable()
export class GetLibraryUseCase {
  constructor(
    private readonly readingListRepository: IReadingListRepository,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async execute(query: GetLibraryQuery): Promise<LibraryItemReadModel[]> {
    const userId = UserId.create(query.userId);
    const status = query.status || ReadingStatus.READING;

    const items = await this.readingListRepository.findAllDetailByUserId(
      userId,
      status,
      query.limit,
    );

    if (items.length > 0) {
      await this.enrichChapterInfo(userId, items);
    }

    return items;
  }

  private async enrichChapterInfo(
    userId: UserId,
    items: LibraryItemReadModel[],
  ): Promise<void> {
    const bookIds = items.map((item) => item.bookId.id);

    const [totalChaptersMap, completedChaptersMap] = await Promise.all([
      this.chapterRepository.countChaptersForBooks(bookIds),
      this.readingProgressRepository.countCompletedByBookIds(
        userId,
        bookIds.map((id) => BookId.create(id)),
      ),
    ]);

    for (const item of items) {
      const bookId = item.bookId.id;
      item.totalChapters = totalChaptersMap.get(bookId) || 0;
      item.completedChapters = completedChaptersMap.get(bookId) || 0;
    }
  }
}
