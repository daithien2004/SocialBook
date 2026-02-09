import { Injectable } from '@nestjs/common';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { ReadingProgress } from '@/domain/library/entities/reading-progress.entity';
import { GetChapterProgressQuery } from './get-chapter-progress.query';

@Injectable()
export class GetChapterProgressUseCase {
    constructor(
        private readonly readingProgressRepository: IReadingProgressRepository
    ) { }

    async execute(query: GetChapterProgressQuery): Promise<ReadingProgress | null> {
        if (!query.bookId || !query.chapterId) {
            return null;
        }

        const userId = UserId.create(query.userId);
        const chapterId = ChapterId.create(query.chapterId);

        return this.readingProgressRepository.findByUserIdAndChapterId(userId, chapterId);
    }
}
