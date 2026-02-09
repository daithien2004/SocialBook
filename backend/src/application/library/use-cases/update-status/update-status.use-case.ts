import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ReadingStatus, ReadingList } from '@/domain/library/entities/reading-list.entity';
import { ReadingListMapper, ReadingListStatusDto } from '../../mappers/reading-list.mapper';

export interface UpdateStatusRequest {
    userId: string;
    bookId: string;
    status: ReadingStatus;
}

// Re-export DTO type for external use
export type UpdateStatusResponse = ReadingListStatusDto;

export class UpdateStatusUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

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

        return ReadingListMapper.toStatusDto(readingList);
    }
}


