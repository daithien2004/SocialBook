import { ReadingRoomResult } from '@/application/reading-rooms/reading-room.interface';
import { PresenceData } from '@/domain/reading-rooms/interfaces/presence-cache.port';
import { RoomSnapshot } from './reading-room.types';

export function toReadingRoomSnapshot(
  room: ReadingRoomResult,
  presences: PresenceData[],
): RoomSnapshot {
  const presenceMap = new Map(presences.map((p) => [p.userId, p]));

  return {
    room: {
      roomId: room.roomId,
      bookId: room.bookId,
      hostId: room.hostId,
      mode: room.mode,
      currentChapterSlug: room.currentChapterSlug,
      status: room.status,
      highlights: room.highlights.map((h) => {
        const presence = presenceMap.get(h.userId);
        const displayName = h.displayName || presence?.displayName || 'Khách';
        const avatarUrl = h.avatarUrl || presence?.avatarUrl || '';
        return {
          id: h.id,
          userId: h.userId,
          displayName,
          avatarUrl,
          chapterSlug: h.chapterSlug,
          paragraphId: h.paragraphId,
          content: h.content,
          aiInsight: h.aiInsight,
          createdAt: h.createdAt,
          user: { userId: h.userId, displayName, avatarUrl },
        };
      }),
    },
    members: room.members.map((m) => ({
      userId: m.userId,
      role: m.role,
    })),
    presences,
  };
}
