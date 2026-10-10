import { BookId as DomainBookId } from '@/modules/library/domain/library/value-objects/book-id.vo';
import { BookId as ChapterBookId } from '@/modules/chapters/domain/public-api';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ReadingList,
  ReadingStatus,
} from '@/modules/library/domain/library/entities/reading-list.entity';
import { ReadingProgress } from '@/modules/library/domain/library/entities/reading-progress.entity';
import { LibraryItemReadModel } from '@/modules/library/domain/library/read-models/library-item.read-model';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/modules/library/domain/library/repositories/reading-progress.repository.interface';
import { BookId } from '@/modules/library/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/modules/library/domain/library/value-objects/chapter-id.vo';
import { UserId } from '@/modules/library/domain/library/value-objects/user-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { InternalServerErrorException } from '@nestjs/common';
import { UpdateProgressCommand } from './update-progress.command';
import { ReadingProgressResult } from '../../dto/library.dto';
import { LibraryApplicationMapper } from '../../mappers/library.mapper';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { ChapterStatus } from '@/modules/library/domain/library/entities/reading-progress.entity';
import { IRecommendationCachePort } from '@/modules/recommendations/domain/public-api';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';

export interface UpdateProgressResult {
  readingList: LibraryItemReadModel;
  readingProgress: ReadingProgressResult;
}

@CommandHandler(UpdateProgressCommand)
export class UpdateProgressHandler implements ICommandHandler<
  UpdateProgressCommand,
  UpdateProgressResult
> {
  constructor(
    private readonly readingListRepository: IReadingListRepository,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly bookRepository: IBookRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly recommendationCache: IRecommendationCachePort,
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  async execute(command: UpdateProgressCommand): Promise<UpdateProgressResult> {
    const userId = UserId.create(command.userId);
    const bookId = BookId.create(command.bookId);
    const chapterId = ChapterId.create(command.chapterId);

    const book = await this.bookRepository.findById(
      DomainBookId.create(command.bookId),
    );
    if (!book) {
      throw new NotFoundDomainException('Sách không tồn tại');
    }

    const transactionResult = await this.unitOfWork.execute(async () => {
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
      let wasCompleted = false;

      if (!readingProgress) {
        readingProgress = ReadingProgress.create({
          id: this.idGenerator.generate(),
          userId: command.userId,
          bookId: command.bookId,
          chapterId: command.chapterId,
          progress: command.progress,
        });
      } else {
        wasCompleted = readingProgress.isCompleted();
        if (command.monotonic) {
          readingProgress.updateProgress(command.progress, { monotonic: true });
        } else {
          // Only increase progress unless it's a reset (e.g., progress === 0)
          if (
            command.progress === 0 ||
            command.progress > readingProgress.progress
          ) {
            readingProgress.updateProgress(command.progress);
          }
        }
      }

      const oldStatus = readingList.status;
      readingList.updateLastReadChapter(command.chapterId);

      const isCompletedNow = readingProgress.isCompleted();

      if (!wasCompleted && isCompletedNow) {
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
        completedChapterIds.add(command.chapterId);

        if (totalChapters > 0 && completedChapterIds.size >= totalChapters) {
          readingList.updateStatus(ReadingStatus.COMPLETED);
        } else {
          readingList.updateStatus(ReadingStatus.READING);
        }
      }

      await this.readingListRepository.save(readingList);
      await this.readingProgressRepository.save(readingProgress);

      return {
        readingProgress,
        shouldClearRecommendations: readingList.status !== oldStatus,
      };
    });

    if (transactionResult.shouldClearRecommendations) {
      void this.recommendationCache.clear(command.userId);
    }

    const detail = await this.readingListRepository.findDetailByUserIdAndBookId(
      userId,
      bookId,
    );
    if (!detail) {
      throw new InternalServerErrorException(
        'Failed to retrieve updated reading list detail',
      );
    }

    return {
      readingList: detail,
      readingProgress: LibraryApplicationMapper.toProgressResult(
        transactionResult.readingProgress,
      ),
    };
  }
}
