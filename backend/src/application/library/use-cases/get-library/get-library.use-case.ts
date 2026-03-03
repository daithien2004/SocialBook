import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { GetLibraryQuery } from './get-library.query';

@Injectable()
export class GetLibraryUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(query: GetLibraryQuery): Promise<LibraryItemReadModel[]> {
        const userId = UserId.create(query.userId);
        const status = query.status || ReadingStatus.READING;

        return this.readingListRepository.findAllDetailByUserId(userId, status);
    }
}
