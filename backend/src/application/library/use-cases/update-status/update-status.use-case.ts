import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ReadingStatus, ReadingList } from '@/domain/library/entities/reading-list.entity';

export interface UpdateStatusRequest {
    userId: string;
    bookId: string;
    status: ReadingStatus;
}

export interface UpdateStatusResponse {
    id: string;
    bookId: string;
    status: ReadingStatus;
    updatedAt: Date;
}

export class UpdateStatusUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) {}

    async execute(request: UpdateStatusRequest): Promise<UpdateStatusResponse> {
        const userId = UserId.create(request.userId);
        const bookId = BookId.create(request.bookId);

        let readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);

        if (!readingList) {
            readingList = ReadingList.create({
                userId: request.userId,
                bookId: request.bookId,
                status: request.status
            });
        } else {
            readingList.updateStatus(request.status);
        }

        await this.readingListRepository.save(readingList);

        return {
            id: readingList.id,
            bookId: readingList.bookId.toString(),
            status: readingList.status,
            updatedAt: readingList.updatedAt
        };
    }
}


