import { Injectable } from '@nestjs/common';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { ReadingProgress } from '@/domain/library/entities/reading-progress.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { RecordReadingTimeCommand } from './record-reading-time.command';

export interface RecordReadingTimeResult {
    readingProgress: ReadingProgress;
    timeSpentMinutes: number;
}

@Injectable()
export class RecordReadingTimeUseCase {
    constructor(
        private readonly readingProgressRepository: IReadingProgressRepository,
        private readonly idGenerator: IIdGenerator,
    ) { }

    async execute(command: RecordReadingTimeCommand): Promise<RecordReadingTimeResult> {
        const userId = UserId.create(command.userId);
        const bookId = BookId.create(command.bookId);
        const chapterId = ChapterId.create(command.chapterId);

        let readingProgress = await this.readingProgressRepository.findByUserIdAndChapterId(userId, chapterId);

        if (!readingProgress) {
            readingProgress = ReadingProgress.create({
                id: this.idGenerator.generate(),
                userId: command.userId,
                bookId: command.bookId,
                chapterId: command.chapterId,
                timeSpent: command.durationInSeconds
            });
        } else {
            readingProgress.addTimeSpent(command.durationInSeconds);
        }

        await this.readingProgressRepository.save(readingProgress);

        const minutes = Math.ceil(command.durationInSeconds / 60);

        return {
            readingProgress,
            timeSpentMinutes: minutes
        };
    }
}
