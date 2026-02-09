import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { ReadingStatus, ReadingList } from '@/domain/library/entities/reading-list.entity';
import { ReadingProgress } from '@/domain/library/entities/reading-progress.entity';
import { UpdateProgressCommand } from './update-progress.command';

export interface UpdateProgressResult {
    readingList: ReadingList;
    readingProgress: ReadingProgress;
}

export class UpdateProgressUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository,
        private readonly readingProgressRepository: IReadingProgressRepository
    ) { }

    async execute(command: UpdateProgressCommand): Promise<UpdateProgressResult> {
        const userId = UserId.create(command.userId);
        const bookId = BookId.create(command.bookId);
        const chapterId = ChapterId.create(command.chapterId);

        // Get or create reading list entry
        let readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);
        if (!readingList) {
            readingList = ReadingList.create({
                userId: command.userId,
                bookId: command.bookId,
                status: ReadingStatus.READING
            });
        }

        // Get or create reading progress
        let readingProgress = await this.readingProgressRepository.findByUserIdAndChapterId(userId, chapterId);
        if (!readingProgress) {
            readingProgress = ReadingProgress.create({
                userId: command.userId,
                bookId: command.bookId,
                chapterId: command.chapterId,
                progress: command.progress
            });
        } else {
            readingProgress.updateProgress(command.progress);
        }

        // Update reading list with last read chapter
        readingList.updateLastReadChapter(command.chapterId);

        // Determine book status based on progress
        const isChapterCompleted = command.progress >= 80;
        let bookStatus = readingList.status;

        if (!readingList.isCompleted() && isChapterCompleted) {

            bookStatus = ReadingStatus.READING;
        }

        readingList.updateStatus(bookStatus);

        // Save both entities
        await Promise.all([
            this.readingListRepository.save(readingList),
            this.readingProgressRepository.save(readingProgress)
        ]);

        return {
            readingList,
            readingProgress
        };
    }
}
