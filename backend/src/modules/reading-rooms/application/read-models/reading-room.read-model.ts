import type { PageResult } from '@/shared/domain/pagination.types';
import type { ReadingRoomStatus } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import type { RoomModeType } from '@/modules/reading-rooms/domain/value-objects/room-mode.vo';

export interface ReadingRoomReadModel {
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
  activeMembers: Array<{
    userId: string;
    role: 'host' | 'member';
  }>;
}

export interface ReadingRoomHighlightReadModel {
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

export interface ReadingRoomPreviewReadModel {
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

export type GetRoomByCodeReadModel =
  (ReadingRoomReadModel & { isMember: true }) | ReadingRoomPreviewReadModel;

export type GetRoomHighlightsReadModel =
  PageResult<ReadingRoomHighlightReadModel>;
