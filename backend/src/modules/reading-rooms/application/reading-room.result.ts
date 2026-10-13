import type { PageResult } from '@/shared/domain/pagination.types';
import type { ReadingRoomStatus } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import type { RoomModeType } from '@/modules/reading-rooms/domain/value-objects/room-mode.vo';

/** Shared output contract for room commands and room-list queries. */
export interface ReadingRoomResult {
  roomId: string;
  bookId: string;
  currentChapterId: string;
  hostId: string;
  mode: RoomModeType;
  status: ReadingRoomStatus;
  currentChapterSlug: string;
  maxMembers: number;
  membersCount: number;
  createdAt: Date;
  members: Array<{ userId: string; role: 'host' | 'member' }>;
}

export interface LeaveRoomResult extends ReadingRoomResult {
  roomEnded: boolean;
}

export interface ReadingRoomHighlightResult {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  chapterSlug: string;
  paragraphId: string;
  content: string;
  aiInsight?: string;
  createdAt: Date;
}

export interface ReadingRoomPreviewResult {
  roomId: string;
  bookId: string;
  mode: RoomModeType;
  status: ReadingRoomStatus;
  currentChapterSlug: string;
  maxMembers: number;
  membersCount: number;
  isFull: boolean;
  isMember: false;
  createdAt: Date;
}

export type GetRoomByCodeResult =
  (ReadingRoomResult & { isMember: true }) | ReadingRoomPreviewResult;

export type GetRoomHighlightsResult = PageResult<ReadingRoomHighlightResult>;
