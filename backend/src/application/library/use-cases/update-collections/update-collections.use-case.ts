import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ReadingList } from '@/domain/library/entities/reading-list.entity';

export interface UpdateCollectionsRequest {
    userId: string;
    bookId: string;
    collectionIds: string[];
}

export interface UpdateCollectionsResponse {
    id: string;
    bookId: string;
    collectionIds: string[];
    updatedAt: Date;
}

export class UpdateCollectionsUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) {}

    async execute(request: UpdateCollectionsRequest): Promise<UpdateCollectionsResponse> {
        const userId = UserId.create(request.userId);
        const bookId = BookId.create(request.bookId);

        let readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);

        if (!readingList) {
            readingList = ReadingList.create({
                userId: request.userId,
                bookId: request.bookId
            });
        }

        readingList.updateCollections(request.collectionIds);
        await this.readingListRepository.save(readingList);

        return {
            id: readingList.id.toString(),
            bookId: readingList.bookId.toString(),
            collectionIds: readingList.collectionIds,
            updatedAt: readingList.updatedAt
        };
    }
}


