import { UserHighlight } from '../entities/user-highlight.entity';

export interface IUserHighlightRepository {
  save(highlight: UserHighlight): Promise<void>;
  findById(id: string): Promise<UserHighlight | null>;
  findByBookId(userId: string, bookId: string): Promise<UserHighlight[]>;
  findByChapterId(userId: string, chapterId: string): Promise<UserHighlight[]>;
  delete(id: string): Promise<void>;
}
