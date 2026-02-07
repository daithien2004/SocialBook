import { IReadingListRepository } from '../../../domain/repositories/reading-list.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { BookId } from '../../../domain/value-objects/book-id.vo';
import { ReadingList } from '../../../domain/entities/reading-list.entity';

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
            id: readingList.id,
            bookId: readingList.bookId.toString(),
            collectionIds: readingList.collectionIds,
            updatedAt: readingList.updatedAt
        };
    }
}
