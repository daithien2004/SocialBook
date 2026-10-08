import { UserHighlight } from '../entities/user-highlight.entity';

export abstract class IUserHighlightRepository {
  abstract save(highlight: UserHighlight): Promise<void>;
  abstract findById(id: string): Promise<UserHighlight | null>;
  abstract findByBookId(
    userId: string,
    bookId: string,
  ): Promise<UserHighlight[]>;
  abstract findByChapterId(
    userId: string,
    chapterId: string,
  ): Promise<UserHighlight[]>;
  abstract delete(id: string): Promise<void>;
}
