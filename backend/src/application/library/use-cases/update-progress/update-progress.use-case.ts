import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { ReadingStatus, ReadingList } from '@/domain/library/entities/reading-list.entity';
import { ReadingProgress, ChapterStatus } from '@/domain/library/entities/reading-progress.entity';

export interface UpdateProgressRequest {
    userId: string;
    bookId: string;
    chapterId: string;
    progress: number;
}

export interface UpdateProgressResponse {
    readingListId: string;
    progressId: string;
    bookStatus: ReadingStatus;
    chapterProgress: number;
    chapterStatus: ChapterStatus;
}

export class UpdateProgressUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository,
        private readonly readingProgressRepository: IReadingProgressRepository
    ) {}

    async execute(request: UpdateProgressRequest): Promise<UpdateProgressResponse> {
        const userId = UserId.create(request.userId);
        const bookId = BookId.create(request.bookId);
        const chapterId = ChapterId.create(request.chapterId);

        // Get or create reading list entry
        let readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);
        if (!readingList) {
            readingList = ReadingList.create({
                userId: request.userId,
                bookId: request.bookId,
                status: ReadingStatus.READING
            });
        }

        // Get or create reading progress
        let readingProgress = await this.readingProgressRepository.findByUserIdAndChapterId(userId, chapterId);
        if (!readingProgress) {
            readingProgress = ReadingProgress.create({
                userId: request.userId,
                bookId: request.bookId,
                chapterId: request.chapterId,
                progress: request.progress
            });
        } else {
            readingProgress.updateProgress(request.progress);
        }

        // Update reading list with last read chapter
        readingList.updateLastReadChapter(request.chapterId);

        // Determine book status based on progress
        const isChapterCompleted = request.progress >= 80;
        let bookStatus = readingList.status;

        if (!readingList.isCompleted() && isChapterCompleted) {
            // In a real implementation, you'd check if this is the last chapter
            // For now, we'll keep the current status
            bookStatus = ReadingStatus.READING;
        }

        readingList.updateStatus(bookStatus);

        // Save both entities
        await Promise.all([
            this.readingListRepository.save(readingList),
            this.readingProgressRepository.save(readingProgress)
        ]);

        return {
            readingListId: readingList.id,
            progressId: readingProgress.id,
            bookStatus: readingList.status,
            chapterProgress: readingProgress.progress,
            chapterStatus: readingProgress.status
        };
    }
}

