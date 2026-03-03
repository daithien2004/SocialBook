import { ReadingList, ReadingStatus } from '../entities/reading-list.entity';
import { LibraryItemReadModel } from '../read-models/library-item.read-model';
import { BookId } from '../value-objects/book-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export abstract class IReadingListRepository {
    abstract save(readingList: ReadingList): Promise<void>;
    abstract findByUserIdAndBookId(userId: UserId, bookId: BookId): Promise<ReadingList | null>;
    abstract remove(userId: UserId, bookId: BookId): Promise<void>;
    abstract exists(userId: UserId, bookId: BookId): Promise<boolean>;
    abstract countByUser(userId: string): Promise<number>;
    abstract countByCollectionId(collectionId: string): Promise<number>;
    abstract findByCollectionId(collectionId: string): Promise<LibraryItemReadModel[]>;
    abstract findDetailByUserIdAndBookId(userId: UserId, bookId: BookId): Promise<LibraryItemReadModel | null>;
    abstract findAllDetailByUserId(userId: UserId, status?: ReadingStatus): Promise<LibraryItemReadModel[]>;
}
