import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ReadingRoomReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { ReadingRoomHighlightReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { ReadingRoomPreviewReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { GetRoomByCodeReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';

type ReadingRoomResponseSource = Pick<
  ReadingRoomReadModel,
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
  role!: 'host' | 'member';
}

export class ReadingRoomResponseDto implements ReadingRoomResponseSource {
  @ApiProperty()
  roomId: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  hostId: string;

  @ApiProperty({ enum: ['sync', 'free'] })
  mode: ReadingRoomReadModel['mode'];

  @ApiProperty({ enum: ['active', 'ended'] })
  status: ReadingRoomReadModel['status'];

  @ApiProperty()
  currentChapterSlug: string;

  @ApiProperty()
  maxMembers: number;

  @ApiProperty()
  membersCount: number;

  @ApiProperty({ type: ReadingRoomMemberResponseDto, isArray: true })
  members: ReadingRoomMemberResponseDto[];

  @ApiProperty({ format: 'date-time' })
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

interface ReadingRoomHighlightResponse {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  chapterSlug: string;
  paragraphId: string;
  content: string;
  aiInsight?: string;
  createdAt: string;
}

export class ReadingRoomHighlightResponseDto implements ReadingRoomHighlightResponse {
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

  constructor(source: ReadingRoomHighlightReadModel) {
    this.id = source.id;
    this.userId = source.userId;
    this.displayName = source.displayName ?? '';
    this.avatarUrl = source.avatarUrl ?? '';
    this.chapterSlug = source.chapterSlug;
    this.paragraphId = source.paragraphId;
    this.content = source.content;
    this.aiInsight = source.aiInsight;
    this.createdAt = source.createdAt.toISOString();
  }

  static fromArray(
    highlights: ReadingRoomHighlightReadModel[],
  ): ReadingRoomHighlightResponseDto[] {
    return highlights.map(
      (highlight) => new ReadingRoomHighlightResponseDto(highlight),
    );
  }
}

export class ReadingRoomPreviewResponseDto implements ReadingRoomPreviewReadModel {
  @ApiProperty()
  roomId!: string;

  @ApiProperty()
  bookId!: string;

  @ApiProperty({ enum: ['sync', 'free'] })
  mode!: ReadingRoomReadModel['mode'];

  @ApiProperty({ enum: ['active', 'ended'] })
  status!: ReadingRoomReadModel['status'];

  @ApiProperty()
  currentChapterSlug!: string;

  @ApiProperty()
  maxMembers!: number;

  @ApiProperty()
  membersCount!: number;

  @ApiProperty()
  isFull!: boolean;

  @ApiProperty({ enum: [false] })
  isMember!: false;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  constructor(result: ReadingRoomPreviewReadModel) {
    this.roomId = result.roomId;
    this.bookId = result.bookId;
    this.mode = result.mode;
    this.status = result.status;
    this.currentChapterSlug = result.currentChapterSlug;
    this.maxMembers = result.maxMembers;
    this.membersCount = result.membersCount;
    this.isFull = result.isFull;
    this.isMember = false;
    this.createdAt = result.createdAt;
  }

  static fromResult(
    result: ReadingRoomPreviewReadModel,
  ): ReadingRoomPreviewResponseDto {
    return new ReadingRoomPreviewResponseDto(result);
  }
}

export function toReadingRoomResponseDto(
  result: GetRoomByCodeReadModel,
): ReadingRoomResponseDto | ReadingRoomPreviewResponseDto {
  if (result.isMember) {
    return ReadingRoomResponseDto.fromResult(result);
  }

  return ReadingRoomPreviewResponseDto.fromResult(result);
}
