import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { ReadingProgress } from '@/domain/library/entities/reading-progress.entity';

export interface RecordReadingTimeRequest {
    userId: string;
    bookId: string;
    chapterId: string;
    durationInSeconds: number;
}

export interface RecordReadingTimeResponse {
    success: boolean;
    timeSpentMinutes: number;
}

export class RecordReadingTimeUseCase {
    constructor(
        private readonly readingProgressRepository: IReadingProgressRepository
    ) {}

    async execute(request: RecordReadingTimeRequest): Promise<RecordReadingTimeResponse> {
        const userId = UserId.create(request.userId);
        const bookId = BookId.create(request.bookId);
        const chapterId = ChapterId.create(request.chapterId);

        // Get or create reading progress
        let readingProgress = await this.readingProgressRepository.findByUserIdAndChapterId(userId, chapterId);
        
        if (!readingProgress) {
            readingProgress = ReadingProgress.create({
                userId: request.userId,
                bookId: request.bookId,
                chapterId: request.chapterId,
                timeSpent: request.durationInSeconds
            });
        } else {
            readingProgress.addTimeSpent(request.durationInSeconds);
        }

        await this.readingProgressRepository.save(readingProgress);

        const minutes = Math.ceil(request.durationInSeconds / 60);

        // Note: Gamification integration should be handled at a higher level
        // or through domain events. For now, we return the time spent
        // so the controller can handle gamification updates.

        return {
            success: true,
            timeSpentMinutes: minutes
        };
    }
}


