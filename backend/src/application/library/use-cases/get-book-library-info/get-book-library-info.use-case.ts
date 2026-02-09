import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ReadingListMapper, ReadingListInfoDto } from '../../mappers/reading-list.mapper';

export interface GetBookLibraryInfoRequest {
    userId: string;
    bookId: string;
}

// Re-export DTO type for external use
export type GetBookLibraryInfoResponse = ReadingListInfoDto;

export class GetBookLibraryInfoUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(request: GetBookLibraryInfoRequest): Promise<GetBookLibraryInfoResponse> {
        const userId = UserId.create(request.userId);
        const bookId = BookId.create(request.bookId);

        const readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);

        return ReadingListMapper.toInfoDto(readingList);
    }
}


