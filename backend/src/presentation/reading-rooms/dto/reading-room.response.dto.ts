import { ReadingRoomResult } from '@/application/reading-rooms/use-cases/reading-room.result';

export class ReadingRoomResponseDto {
  roomId: string;
  bookId: string;
  hostId: string;
  mode: string;
  status: string;
  currentChapterSlug: string;
  maxMembers: number;
  membersCount: number;
  members: Array<{ userId: string; role: string }>;
  createdAt: Date;

  constructor(room: ReadingRoomResult) {
    this.roomId = room.roomId;
    this.bookId = room.bookId;
    this.hostId = room.hostId;
    this.mode = room.mode;
    this.status = room.status;
    this.currentChapterSlug = room.currentChapterSlug;
    this.maxMembers = room.maxMembers;
    this.membersCount = room.membersCount;
    this.members = room.members;
    this.createdAt = room.createdAt;
  }

  static fromResult(room: ReadingRoomResult): ReadingRoomResponseDto {
    return new ReadingRoomResponseDto(room);
  }

  static fromArray(rooms: ReadingRoomResult[]): ReadingRoomResponseDto[] {
    return rooms.map((room) => new ReadingRoomResponseDto(room));
  }
}
