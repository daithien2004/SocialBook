import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { GetBookLibraryInfoQuery } from './get-book-library-info.query';
import { ReadingListResult } from '../../mappers/library.results';
import { LibraryApplicationMapper } from '../../mappers/library.mapper';

export interface CollectionResult {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetBookLibraryInfoResult {
    readingList: ReadingListResult | null;
    collections: CollectionResult[];
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

        let collections: CollectionResult[] = [];
        if (readingList && readingList.collectionIds.length > 0) {
            const collectionEntities = await this.collectionRepository.findByIds(readingList.collectionIds);
            collections = collectionEntities.map(c => LibraryApplicationMapper.toCollectionResult(c));
        }

        return {
            readingList: readingList ? LibraryApplicationMapper.toListResult(readingList) : null,
            collections
        };
    }
}
