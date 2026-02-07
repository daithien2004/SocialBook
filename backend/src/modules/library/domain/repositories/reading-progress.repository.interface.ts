import { ReadingProgress } from '../entities/reading-progress.entity';
import { UserId } from '../value-objects/user-id.vo';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';

export abstract class IReadingProgressRepository {
    abstract save(progress: ReadingProgress): Promise<void>;
    abstract findByUserIdAndChapterId(userId: UserId, chapterId: ChapterId): Promise<ReadingProgress | null>;
    abstract findByUserIdAndBookId(userId: UserId, bookId: BookId): Promise<ReadingProgress[]>;
    abstract findByUserId(userId: UserId): Promise<ReadingProgress[]>;
    abstract remove(userId: UserId, chapterId: ChapterId): Promise<void>;
    abstract exists(userId: UserId, chapterId: ChapterId): Promise<boolean>;
}
