import { BookId as ChapterBookId } from '@/domain/chapters/value-objects/book-id.vo';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { GetBookLibraryInfoQuery } from './get-book-library-info.query';
import { ReadingListResult } from '../../dto/library.dto';
import { LibraryApplicationMapper } from '../../mappers/library.mapper';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ChapterStatus } from '@/domain/library/entities/reading-progress.entity';

export interface CollectionResult {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetBookLibraryInfoResult {
  readingList: ReadingListResult | null;
  collections: CollectionResult[];
  completedChaptersCount: number;
  totalChapters: number;
}

@QueryHandler(GetBookLibraryInfoQuery)
export class GetBookLibraryInfoHandler implements IQueryHandler<
  GetBookLibraryInfoQuery,
  GetBookLibraryInfoResult
> {
  constructor(
    private readonly readingListRepository: IReadingListRepository,
    private readonly collectionRepository: ICollectionRepository,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async execute(
    query: GetBookLibraryInfoQuery,
  ): Promise<GetBookLibraryInfoResult> {
    const userId = UserId.create(query.userId);
    const bookId = BookId.create(query.bookId);

    const readingList = await this.readingListRepository.findByUserIdAndBookId(
      userId,
      bookId,
    );

    let collections: CollectionResult[] = [];
    if (readingList && readingList.collectionIds.length > 0) {
      const collectionEntities = await this.collectionRepository.findByIds(
        readingList.collectionIds,
      );
      collections = collectionEntities.map((c) =>
        LibraryApplicationMapper.toCollectionResult(c),
      );
    }

    const readProgresses =
      await this.readingProgressRepository.findByUserIdAndBookId(
        userId,
        bookId,
      );

    const completedChaptersCount = readProgresses.filter(
      (p) => p.status === ChapterStatus.COMPLETED,
    ).length;

    const totalChapters = await this.chapterRepository.countByBook(
      ChapterBookId.create(query.bookId),
    );

    return {
      readingList: readingList
        ? LibraryApplicationMapper.toListResult(readingList)
        : null,
      collections,
      completedChaptersCount,
      totalChapters,
    };
  }
}
