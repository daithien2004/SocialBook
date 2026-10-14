import { ReadingRoomReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import { PresenceData } from '@/modules/reading-rooms/application/ports/external/presence-cache.port';
import { RoomSnapshot } from './reading-room.types';

export function toReadingRoomSnapshot(
  room: ReadingRoomReadModel,
  presences: PresenceData[],
): RoomSnapshot {
  return {
    room: {
      roomId: room.roomId,
      bookId: room.bookId,
      hostId: room.hostId,
      mode: room.mode,
      currentChapterSlug: room.currentChapterSlug,
      status: room.status,
    },
    members: room.members.map((m) => ({
      userId: m.userId,
      role: m.role,
    })),
    presences,
  };
}
