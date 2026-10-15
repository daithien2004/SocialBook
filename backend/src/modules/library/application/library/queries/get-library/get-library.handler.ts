import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import type { LibraryItemReadModel } from '@/modules/library/application/read-models/library-item.read-model';
import { LibraryReadRepository } from '@/modules/library/application/ports/library-read.repository';
import { IReadingProgressRepository } from '@/modules/library/domain/library/repositories/reading-progress.repository.interface';
import { BookId } from '@/modules/library/domain/library/value-objects/book-id.vo';
import { UserId } from '@/modules/library/domain/library/value-objects/user-id.vo';
import { IChapterReadRepository } from '@/modules/chapters';
import { GetLibraryQuery } from './get-library.query';
import { assertLibraryAccess } from '@/modules/library/application/policies/library-access.policy';
import type { PageResult } from '@/shared/domain/pagination.types';

@QueryHandler(GetLibraryQuery)
export class GetLibraryHandler implements IQueryHandler<
  GetLibraryQuery,
  PageResult<LibraryItemReadModel>
> {
  constructor(
    private readonly libraryReadRepository: LibraryReadRepository,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly chapterRepository: IChapterReadRepository,
  ) {}

  async execute(
    query: GetLibraryQuery,
  ): Promise<PageResult<LibraryItemReadModel>> {
    assertLibraryAccess(query.actor, 'read', query.userId);
    const userId = UserId.create(query.userId);
    const status = query.status;

    const page = await this.libraryReadRepository.findPageByUser(
      userId.toString(),
      status,
      query.page,
    );

    if (page.items.length > 0) {
      await this.enrichChapterInfo(userId, page.items);
    }

    return page;
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
