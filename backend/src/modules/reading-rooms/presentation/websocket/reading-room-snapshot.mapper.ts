import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.interface';
import { PresenceData } from '@/modules/reading-rooms/domain/interfaces/presence-cache.port';
import { RoomSnapshot } from './reading-room.types';

export function toReadingRoomSnapshot(
  room: ReadingRoomResult,
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
