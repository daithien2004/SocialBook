import { Injectable } from '@nestjs/common';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { GetChapterProgressQuery } from './get-chapter-progress.query';
import { ReadingProgressResult } from '../../mappers/library.results';
import { LibraryApplicationMapper } from '../../mappers/library.mapper';

@Injectable()
export class GetChapterProgressUseCase {
    constructor(
        private readonly readingProgressRepository: IReadingProgressRepository
    ) { }

    async execute(query: GetChapterProgressQuery): Promise<ReadingProgressResult | null> {
        if (!query.bookId || !query.chapterId) {
            return null;
        }

        const userId = UserId.create(query.userId);
        const chapterId = ChapterId.create(query.chapterId);

        const progress = await this.readingProgressRepository.findByUserIdAndChapterId(userId, chapterId);
        
        if (!progress) {
            return null;
        }

        return LibraryApplicationMapper.toProgressResult(progress);
    }
}
