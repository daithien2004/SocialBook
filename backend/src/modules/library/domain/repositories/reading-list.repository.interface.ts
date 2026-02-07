import { ReadingList, ReadingStatus } from '../entities/reading-list.entity';
import { UserId } from '../value-objects/user-id.vo';
import { BookId } from '../value-objects/book-id.vo';
import { PaginatedResult } from '../../../../common/interfaces/pagination.interface';

export abstract class IReadingListRepository {
    abstract save(readingList: ReadingList): Promise<void>;
    abstract findByUserIdAndBookId(userId: UserId, bookId: BookId): Promise<ReadingList | null>;
    abstract findByUserId(userId: UserId, status?: ReadingStatus): Promise<ReadingList[]>;
    abstract findByUserIdWithPagination(userId: UserId, status: ReadingStatus, pagination: { page: number; limit: number }): Promise<PaginatedResult<ReadingList>>;
    abstract remove(userId: UserId, bookId: BookId): Promise<void>;
    abstract exists(userId: UserId, bookId: BookId): Promise<boolean>;
    abstract countByUser(userId: string): Promise<number>;
}
