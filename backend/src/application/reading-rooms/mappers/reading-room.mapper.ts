import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { ReadingRoomResult } from '../use-cases/reading-room.result';

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
      updatedAt: room.updatedAt,
      members: room.members.map(m => ({ userId: m.userId, role: m.role })),
    };
  }

  static toResultArray(rooms: ReadingRoom[]): ReadingRoomResult[] {
    return rooms.map(room => this.toResult(room));
  }
}
