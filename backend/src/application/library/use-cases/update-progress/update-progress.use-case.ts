import {
  ReadingList,
  ReadingStatus,
} from '@/domain/library/entities/reading-list.entity';
import { ReadingProgress } from '@/domain/library/entities/reading-progress.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Injectable } from '@nestjs/common';
import { UpdateProgressCommand } from './update-progress.command';
import { ReadingProgressResult } from '../../dto/library.dto';
import { LibraryApplicationMapper } from '../../mappers/library.mapper';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId as DomainBookId } from '@/domain/books/value-objects/book-id.vo';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId as ChapterBookId } from '@/domain/chapters/value-objects/book-id.vo';
import { ChapterStatus } from '@/domain/library/entities/reading-progress.entity';
import { RecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';

export interface UpdateProgressResult {
  readingList: LibraryItemReadModel;
  readingProgress: ReadingProgressResult;
}

@Injectable()
export class UpdateProgressUseCase {
  constructor(
    private readonly readingListRepository: IReadingListRepository,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly recommendationCache: RecommendationCachePort,
  ) {}

  async execute(command: UpdateProgressCommand): Promise<UpdateProgressResult> {
    const userId = UserId.create(command.userId);
    const bookId = BookId.create(command.bookId);
    const chapterId = ChapterId.create(command.chapterId);

    let readingList = await this.readingListRepository.findByUserIdAndBookId(
      userId,
      bookId,
    );
    if (!readingList) {
      readingList = ReadingList.create({
        id: this.idGenerator.generate(),
        userId: command.userId,
        bookId: command.bookId,
        status: ReadingStatus.READING,
      });
    }

    let readingProgress =
      await this.readingProgressRepository.findByUserIdAndChapterId(
        userId,
        chapterId,
      );
    if (!readingProgress) {
      readingProgress = ReadingProgress.create({
        id: this.idGenerator.generate(),
        userId: command.userId,
        bookId: command.bookId,
        chapterId: command.chapterId,
        progress: command.progress,
      });
    } else {
      readingProgress.updateProgress(command.progress);
    }

    readingList.updateLastReadChapter(command.chapterId);

    if (!readingList.isCompleted()) {
      const book = await this.bookRepository.findById(
        DomainBookId.create(command.bookId),
      );

      if (book && book.status.toString() === 'completed') {
        const [totalChapters, allProgresses] = await Promise.all([
          this.chapterRepository.countByBook(
            ChapterBookId.create(command.bookId),
          ),
          this.readingProgressRepository.findByUserIdAndBookId(userId, bookId),
        ]);

        const completedChapterIds = new Set(
          allProgresses
            .filter((p) => p.status === ChapterStatus.COMPLETED)
            .map((p) => p.chapterId.toString()),
        );

        if (readingProgress.isCompleted()) {
          completedChapterIds.add(command.chapterId);
        }

        if (totalChapters > 0 && completedChapterIds.size >= totalChapters) {
          readingList.updateStatus(ReadingStatus.COMPLETED);
        } else {
          readingList.updateStatus(ReadingStatus.READING);
        }
      } else {
        readingList.updateStatus(ReadingStatus.READING);
      }
    }

    await Promise.all([
      this.readingListRepository.save(readingList),
      this.readingProgressRepository.save(readingProgress),
    ]);

    this.recommendationCache.clear(command.userId);

    const detail = await this.readingListRepository.findDetailByUserIdAndBookId(
      userId,
      bookId,
    );
    if (!detail) {
      throw new Error('Failed to retrieve updated reading list detail');
    }

    return {
      readingList: detail,
      readingProgress:
        LibraryApplicationMapper.toProgressResult(readingProgress),
    };
  }
}
