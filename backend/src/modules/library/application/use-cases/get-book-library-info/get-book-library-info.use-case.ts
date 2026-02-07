import { IReadingListRepository } from '../../../domain/repositories/reading-list.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { BookId } from '../../../domain/value-objects/book-id.vo';
import { ReadingStatus } from '../../../domain/entities/reading-list.entity';

export interface GetBookLibraryInfoRequest {
    userId: string;
    bookId: string;
}

export interface GetBookLibraryInfoResponse {
    status: ReadingStatus | null;
    collections: string[];
}

export class GetBookLibraryInfoUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) {}

    async execute(request: GetBookLibraryInfoRequest): Promise<GetBookLibraryInfoResponse> {
        const userId = UserId.create(request.userId);
        const bookId = BookId.create(request.bookId);

        const readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);

        if (!readingList) {
            return {
                status: null,
                collections: []
            };
        }

        return {
            status: readingList.status,
            collections: readingList.collectionIds
        };
    }
}
