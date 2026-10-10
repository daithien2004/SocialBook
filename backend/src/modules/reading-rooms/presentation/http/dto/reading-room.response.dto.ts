import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.interface';

type ReadingRoomResponseSource = Pick<
  ReadingRoomResult,
  | 'roomId'
  | 'bookId'
  | 'hostId'
  | 'mode'
  | 'status'
  | 'currentChapterSlug'
  | 'maxMembers'
  | 'membersCount'
  | 'members'
  | 'createdAt'
>;

class ReadingRoomMemberResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: ['host', 'member'] })
  role!: string;
}

export class ReadingRoomResponseDto {
  @ApiProperty()
  roomId: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  hostId: string;

  @ApiProperty({ enum: ['sync', 'free'] })
  mode: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  currentChapterSlug: string;

  @ApiProperty()
  maxMembers: number;

  @ApiProperty()
  membersCount: number;

  @ApiProperty({ type: ReadingRoomMemberResponseDto, isArray: true })
  members: ReadingRoomMemberResponseDto[];

  @ApiProperty()
  createdAt: Date;

  constructor(room: ReadingRoomResponseSource) {
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

  static fromResult(room: ReadingRoomResponseSource): ReadingRoomResponseDto {
    return new ReadingRoomResponseDto(room);
  }

  static fromArray(
    rooms: ReadingRoomResponseSource[],
  ): ReadingRoomResponseDto[] {
    return rooms.map((room) => new ReadingRoomResponseDto(room));
  }
}

export class ReadingRoomHighlightResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  avatarUrl!: string;

  @ApiProperty()
  chapterSlug!: string;

  @ApiProperty()
  paragraphId!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  aiInsight?: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
