import { ReadingRoom } from '../entities/reading-room.entity';
import { RoomId } from '../value-objects/room-id.vo';
import { RoomHighlightProps } from '../entities/reading-room.entity';

export interface ReadingRoomHighlightPageItem extends Omit<
  RoomHighlightProps,
  'createdAt'
> {
  createdAt: Date;
}

export interface ReadingRoomHighlightPage {
  items: ReadingRoomHighlightPageItem[];
  total: number;
}

export abstract class IReadingRoomRepository {
  abstract findById(id: RoomId): Promise<ReadingRoom | null>;
  abstract findHighlightPage(
    id: RoomId,
    userId: string,
    offset: number,
    limit: number,
  ): Promise<ReadingRoomHighlightPage | null>;
  abstract findActiveByUser(userId: string): Promise<ReadingRoom[]>;
  abstract save(room: ReadingRoom): Promise<void>;
  abstract updateStatus(id: RoomId, status: 'active' | 'ended'): Promise<void>;
  abstract delete(id: RoomId): Promise<void>;
  abstract setHighlightInsightIfEmpty(
    roomId: RoomId,
    highlightId: string,
    insight: string,
  ): Promise<boolean>;
}
