import { ReadingList } from '../entities/reading-list.entity';
import { BookId } from '../value-objects/book-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export abstract class IReadingListRepository {
  abstract save(readingList: ReadingList): Promise<void>;
  abstract findByUserIdAndBookId(
    userId: UserId,
    bookId: BookId,
  ): Promise<ReadingList | null>;
  abstract remove(userId: UserId, bookId: BookId): Promise<void>;
  abstract exists(userId: UserId, bookId: BookId): Promise<boolean>;
}
