import { Collection } from '@/domain/library/entities/collection.entity';
import { ReadingList } from '@/domain/library/entities/reading-list.entity';
import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { GetBookLibraryInfoQuery } from './get-book-library-info.query';

export interface GetBookLibraryInfoResult {
    readingList: ReadingList | null;
    collections: Collection[];
}

@Injectable()
export class GetBookLibraryInfoUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository,
        private readonly collectionRepository: ICollectionRepository
    ) { }

    async execute(query: GetBookLibraryInfoQuery): Promise<GetBookLibraryInfoResult> {
        const userId = UserId.create(query.userId);
        const bookId = BookId.create(query.bookId);

        const readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);

        let collections: Collection[] = [];
        if (readingList && readingList.collectionIds.length > 0) {
            collections = await this.collectionRepository.findByIds(readingList.collectionIds);
        }

        return {
            readingList,
            collections
        };
    }
}
