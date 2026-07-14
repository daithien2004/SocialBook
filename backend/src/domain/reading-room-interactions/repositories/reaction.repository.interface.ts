import { RoomReaction } from '../entities/room-reaction.entity';

export interface ReactionSummary {
  paragraphId: string;
  reactions: Record<string, number>;
  userReactions: Record<string, string>; // { type: [count merged] }
}

export abstract class IReactionRepository {
  abstract save(reaction: RoomReaction): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findByParagraph(
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    options?: { limit?: number },
  ): Promise<RoomReaction[]>;
  abstract findByRoom(
    roomId: string,
    chapterSlug?: string,
    options?: { limit?: number },
  ): Promise<RoomReaction[]>;
  abstract findUserReaction(
    roomId: string,
    paragraphId: string,
    userId: string,
    type: string,
  ): Promise<RoomReaction | null>;
  abstract getSummary(
    roomId: string,
    chapterSlug: string,
    paragraphIds: string[],
  ): Promise<ReactionSummary[]>;
  abstract deleteByRoom(roomId: string): Promise<void>;
}
