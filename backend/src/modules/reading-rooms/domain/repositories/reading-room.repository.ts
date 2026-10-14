import { ReadingRoom } from '../entities/reading-room.entity';
import { RoomId } from '../value-objects/room-id.vo';

export abstract class ReadingRoomRepository {
  abstract findById(id: RoomId): Promise<ReadingRoom | null>;
  abstract save(room: ReadingRoom): Promise<void>;
}
