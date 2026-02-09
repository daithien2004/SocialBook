import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { BookLibraryInfoResponseDto } from '@/presentation/library/dto/library.response.dto';

export interface GetBookLibraryInfoRequest {
    userId: string;
    bookId: string;
}

export class GetBookLibraryInfoUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(request: GetBookLibraryInfoRequest): Promise<BookLibraryInfoResponseDto> {
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


