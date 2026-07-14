import { RoomComment } from '../entities/room-comment.entity';

export abstract class ICommentRepository {
  abstract save(comment: RoomComment): Promise<void>;
  abstract findById(id: string): Promise<RoomComment | null>;
  abstract findByParagraph(
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    options?: { limit?: number; before?: Date },
  ): Promise<RoomComment[]>;
  abstract findByRoom(
    roomId: string,
    chapterSlug?: string,
    options?: { limit?: number; before?: Date },
  ): Promise<RoomComment[]>;
  abstract delete(id: string): Promise<void>;
  abstract deleteByRoom(roomId: string): Promise<void>;
}
