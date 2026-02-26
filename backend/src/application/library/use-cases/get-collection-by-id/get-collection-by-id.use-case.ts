import { Collection } from '@/domain/library/entities/collection.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';
import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { GetCollectionByIdQuery } from './get-collection-by-id.query';

export interface GetCollectionByIdResult {
    collection: Collection;
    books: LibraryItemReadModel[];
}

@Injectable()
export class GetCollectionByIdUseCase {
    constructor(
        private readonly collectionRepository: ICollectionRepository,
        private readonly readingListRepository: IReadingListRepository,
    ) { }

    async execute(query: GetCollectionByIdQuery): Promise<GetCollectionByIdResult | null> {
        const collection = await this.collectionRepository.findById(query.collectionId);

        if (!collection) {
            return null;
        }

        if (!collection.isPublic && collection.userId.toString() !== query.userId) {
            throw new ForbiddenException('You do not have permission to view this collection');
        }

        const books = await this.readingListRepository.findByCollectionId(collection.id);

        return {
            collection,
            books
        };
    }
}
