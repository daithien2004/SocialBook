import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import {
  IReadingRoomRepository,
  ReadingRoomHighlightPage,
} from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

export class FakeReadingRoomRepository extends IReadingRoomRepository {
  readonly rooms = new Map<string, ReadingRoom>();
  readonly savedRooms: ReadingRoom[] = [];

  seed(room: ReadingRoom): void {
    this.rooms.set(room.roomId, room);
  }

  findById(id: RoomId): Promise<ReadingRoom | null> {
    return Promise.resolve(this.rooms.get(id.toString()) ?? null);
  }

  findHighlightPage(
    _id: RoomId,
    _userId: string,
    _offset: number,
    _limit: number,
  ): Promise<ReadingRoomHighlightPage | null> {
    return Promise.resolve(null);
  }

  findActiveByCode(_code: string): Promise<ReadingRoom | null> {
    return Promise.resolve(null);
  }

  findActiveByUser(_userId: string): Promise<ReadingRoom[]> {
    return Promise.resolve([]);
  }

  findHistoryByUser(
    _userId: string,
    _options?: { skip?: number; limit?: number },
  ): Promise<{ items: ReadingRoom[]; total: number }> {
    return Promise.resolve({ items: [], total: 0 });
  }

  save(room: ReadingRoom): Promise<void> {
    this.savedRooms.push(room);
    this.rooms.set(room.roomId, room);
    return Promise.resolve();
  }

  updateStatus(_id: RoomId, _status: 'active' | 'ended'): Promise<void> {
    return Promise.resolve();
  }

  delete(id: RoomId): Promise<void> {
    this.rooms.delete(id.toString());
    return Promise.resolve();
  }

  setHighlightInsightIfEmpty(
    _roomId: RoomId,
    _highlightId: string,
    _insight: string,
  ): Promise<boolean> {
    return Promise.resolve(false);
  }
}
