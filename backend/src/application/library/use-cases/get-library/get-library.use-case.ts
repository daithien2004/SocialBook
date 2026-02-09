import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { ReadingStatus, ReadingList } from '@/domain/library/entities/reading-list.entity';
import { GetLibraryQuery } from './get-library.query';

export class GetLibraryUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(query: GetLibraryQuery): Promise<ReadingList[]> {
        const userId = UserId.create(query.userId);
        const status = query.status || ReadingStatus.READING;

        return this.readingListRepository.findByUserId(userId, status);
    }
}
