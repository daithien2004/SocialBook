import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { ReadingRoomResult } from '../reading-room.interface';

export class ReadingRoomApplicationMapper {
  static toResult(room: ReadingRoom): ReadingRoomResult {
    return {
      roomId: room.roomId,
      bookId: room.bookId,
      hostId: room.hostId,
      mode: room.mode,
      status: room.status,
      currentChapterSlug: room.currentChapterSlug,
      maxMembers: room.maxMembers,
      membersCount: room.activeMembers.length,
      createdAt: room.createdAt,
      members: room.activeMembers.map((m) => ({
        userId: m.userId,
        role: m.role,
      })),
    };
  }
}
