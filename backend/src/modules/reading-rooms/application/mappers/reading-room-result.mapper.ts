import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';

export function toReadingRoomResult(room: ReadingRoom): ReadingRoomResult {
  return {
    roomId: room.roomId,
    bookId: room.bookId,
    currentChapterId: room.currentChapterId,
    hostId: room.hostId,
    mode: room.mode,
    status: room.status,
    currentChapterSlug: room.currentChapterSlug,
    maxMembers: room.maxMembers,
    membersCount: room.activeMembers.length,
    createdAt: room.createdAt,
    members: room.activeMembers.map((member) => ({
      userId: member.userId,
      role: member.role,
    })),
  };
}
