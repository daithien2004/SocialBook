import { Collection } from '@/domain/library/entities/collection.entity';
import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { Injectable } from '@nestjs/common';
import { GetAllCollectionsQuery } from './get-all-collections.query';

export interface GetAllCollectionsResult {
    collection: Collection;
    bookCount: number;
}

@Injectable()
export class GetAllCollectionsUseCase {
    constructor(
        private readonly collectionRepository: ICollectionRepository,
        private readonly readingListRepository: IReadingListRepository,
    ) { }

    async execute(query: GetAllCollectionsQuery): Promise<GetAllCollectionsResult[]> {
        const collections = await this.collectionRepository.findByUserId(query.userId);

        const results = await Promise.all(collections.map(async (collection) => {
            const bookCount = await this.readingListRepository.countByCollectionId(collection.id);

            return {
                collection,
                bookCount
            };
        }));

        return results;
    }
}
