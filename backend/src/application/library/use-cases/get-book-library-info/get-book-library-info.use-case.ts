import { Injectable } from '@nestjs/common';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ReadingList } from '@/domain/library/entities/reading-list.entity';
import { GetBookLibraryInfoQuery } from './get-book-library-info.query';

@Injectable()
export class GetBookLibraryInfoUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(query: GetBookLibraryInfoQuery): Promise<ReadingList | null> {
        const userId = UserId.create(query.userId);
        const bookId = BookId.create(query.bookId);

        return this.readingListRepository.findByUserIdAndBookId(userId, bookId);
    }
}
