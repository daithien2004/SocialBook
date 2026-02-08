import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';

export interface GetLibraryRequest {
    userId: string;
    status?: ReadingStatus;
}

export interface GetLibraryResponse {
    id: string;
    bookId: string;
    status: ReadingStatus;
    lastReadChapterId: string | null;
    collectionIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export class GetLibraryUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) {}

    async execute(request: GetLibraryRequest): Promise<GetLibraryResponse[]> {
        const userId = UserId.create(request.userId);
        const status = request.status || ReadingStatus.READING;

        const readingLists = await this.readingListRepository.findByUserId(userId, status);

        return readingLists.map(readingList => ({
            id: readingList.id,
            bookId: readingList.bookId.toString(),
            status: readingList.status,
            lastReadChapterId: readingList.lastReadChapterId?.toString() || null,
            collectionIds: readingList.collectionIds,
            createdAt: readingList.createdAt,
            updatedAt: readingList.updatedAt
        }));
    }
}


