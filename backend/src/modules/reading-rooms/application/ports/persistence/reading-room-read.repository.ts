import type {
  ReadingRoomHighlightResult,
  ReadingRoomResult,
} from '@/modules/reading-rooms/application/reading-room.result';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { ReadingRoomStatus } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import type { RoomModeType } from '@/modules/reading-rooms/domain/value-objects/room-mode.vo';

export interface ReadingRoomDetailsReadModel {
  roomId: string;
  bookId: string;
  hostId: string;
  mode: RoomModeType;
  status: ReadingRoomStatus;
  currentChapterId: string;
  currentChapterSlug: string;
  maxMembers: number;
  createdAt: Date;
  members: Array<{
    userId: string;
    role: 'host' | 'member';
    leftAt?: Date | null;
  }>;
}

export abstract class IReadingRoomReadRepository {
  abstract findHighlightPage(
    roomId: string,
    userId: string,
    pagination: PageParams,
  ): Promise<PageResult<ReadingRoomHighlightResult> | null>;

  abstract findDetailsById(
    roomId: string,
  ): Promise<ReadingRoomDetailsReadModel | null>;

  abstract findActiveSummariesByUser(
    userId: string,
    options: PageParams,
  ): Promise<PageResult<ReadingRoomResult>>;

  abstract findHistorySummariesByUser(
    userId: string,
    options: PageParams,
  ): Promise<PageResult<ReadingRoomResult>>;
}
