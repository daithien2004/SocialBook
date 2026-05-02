import { ReadingRoom } from '../entities/reading-room.entity';
import { RoomId } from '../value-objects/room-id.vo';

export abstract class IReadingRoomRepository {
  abstract findById(id: RoomId): Promise<ReadingRoom | null>;
  abstract findActiveByCode(code: string): Promise<ReadingRoom | null>;
  abstract findActiveByUser(userId: string): Promise<ReadingRoom[]>;
  abstract findHistoryByUser(userId: string, options?: { skip?: number; limit?: number }): Promise<{ items: ReadingRoom[]; total: number }>;
  abstract save(room: ReadingRoom): Promise<void>;
  abstract updateStatus(id: RoomId, status: 'active' | 'ended'): Promise<void>;
}
