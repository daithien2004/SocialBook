import { Prisma } from '@/core/database/generated/prisma/client';
import { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { RoomMember } from '@/modules/reading-rooms/domain/entities/room-member.entity';
import type {
  ReadingRoomDetailsReadModel,
  ReadingRoomHighlightReadModel,
  ReadingRoomReadModel,
} from '@/modules/reading-rooms/application/read-models/reading-room.read-model';

export const READING_ROOM_WITH_STATE = {
  members: { orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }] },
  highlights: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.ReadingRoomInclude;

export const ROOM_DETAILS_SELECT = {
  id: true,
  bookId: true,
  hostId: true,
  mode: true,
  status: true,
  currentChapterId: true,
  currentChapterSlug: true,
  maxMembers: true,
  createdAt: true,
  chapter: { select: { slug: true } },
  members: {
    where: { leftAt: null },
    select: { userId: true, role: true },
  },
} satisfies Prisma.ReadingRoomSelect;

const SUMMARY_FIELDS = {
  id: true,
  bookId: true,
  hostId: true,
  mode: true,
  status: true,
  currentChapterId: true,
  currentChapterSlug: true,
  maxMembers: true,
  createdAt: true,
  chapter: { select: { slug: true } },
} satisfies Prisma.ReadingRoomSelect;

export const ACTIVE_SUMMARY_SELECT = {
  ...SUMMARY_FIELDS,
  members: {
    where: { leftAt: null },
    select: { userId: true, role: true },
  },
} satisfies Prisma.ReadingRoomSelect;

export const HISTORY_SUMMARY_SELECT = {
  ...SUMMARY_FIELDS,
  members: { select: { userId: true, role: true } },
} satisfies Prisma.ReadingRoomSelect;

export const HIGHLIGHT_SELECT = {
  id: true,
  userId: true,
  displayName: true,
  avatarUrl: true,
  chapterSlug: true,
  paragraphId: true,
  content: true,
  aiInsight: true,
  createdAt: true,
} satisfies Prisma.ReadingRoomHighlightSelect;

export type ReadingRoomWithState = Prisma.ReadingRoomGetPayload<{
  include: typeof READING_ROOM_WITH_STATE;
}>;

export type HighlightRow = Prisma.ReadingRoomHighlightGetPayload<{
  select: typeof HIGHLIGHT_SELECT;
}>;

export type RoomDetailsRow = Prisma.ReadingRoomGetPayload<{
  select: typeof ROOM_DETAILS_SELECT;
}>;

export type ActiveSummaryRow = Prisma.ReadingRoomGetPayload<{
  select: typeof ACTIVE_SUMMARY_SELECT;
}>;

export type HistorySummaryRow = Prisma.ReadingRoomGetPayload<{
  select: typeof HISTORY_SUMMARY_SELECT;
}>;

export class ReadingRoomMapper {
  static toDomain(row: ReadingRoomWithState): DomainReadingRoom {
    return DomainReadingRoom.reconstitute({
      id: row.id,
      bookId: row.bookId,
      currentChapterId: row.currentChapterId,
      hostId: row.hostId,
      mode: requireRoomMode(row.mode),
      status: requireRoomStatus(row.status),
      currentChapterSlug: row.currentChapterSlug,
      maxMembers: row.maxMembers,
      members: row.members.map((member) => ({
        userId: member.userId,
        role: requireMemberRole(member.role),
        joinedAt: member.joinedAt,
        leftAt: member.leftAt ?? undefined,
      })),
      highlights: row.highlights.map((highlight) => ({
        id: highlight.id,
        userId: highlight.userId,
        displayName: highlight.displayName ?? undefined,
        avatarUrl: highlight.avatarUrl ?? undefined,
        chapterSlug: highlight.chapterSlug,
        paragraphId: highlight.paragraphId,
        content: highlight.content,
        aiInsight: highlight.aiInsight ?? undefined,
        createdAt: highlight.createdAt,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      endedAt: row.endedAt ?? undefined,
      version: row.version,
    });
  }

  static toCreateData(
    room: DomainReadingRoom,
  ): Prisma.ReadingRoomUncheckedCreateInput {
    return {
      id: room.roomId,
      bookId: room.bookId,
      hostId: room.hostId,
      mode: room.mode,
      status: room.status,
      currentChapterId: room.currentChapterId,
      currentChapterSlug: room.currentChapterSlug,
      maxMembers: room.maxMembers,
      endedAt: room.endedAt ?? null,
      version: room.version,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  static toUpdateData(
    room: DomainReadingRoom,
    version: number,
  ): Prisma.ReadingRoomUncheckedUpdateManyInput {
    return {
      bookId: room.bookId,
      hostId: room.hostId,
      mode: room.mode,
      status: room.status,
      currentChapterId: room.currentChapterId,
      currentChapterSlug: room.currentChapterSlug,
      maxMembers: room.maxMembers,
      endedAt: room.endedAt ?? null,
      version,
      updatedAt: room.updatedAt,
    };
  }

  static toMemberPersistence(member: RoomMember) {
    return {
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      leftAt: member.leftAt ?? null,
    };
  }

  static toHighlightReadModel(
    highlight: HighlightRow,
  ): ReadingRoomHighlightReadModel {
    return {
      id: highlight.id,
      userId: highlight.userId,
      displayName: highlight.displayName ?? undefined,
      avatarUrl: highlight.avatarUrl ?? undefined,
      chapterSlug: highlight.chapterSlug,
      paragraphId: highlight.paragraphId,
      content: highlight.content,
      aiInsight: highlight.aiInsight ?? undefined,
      createdAt: highlight.createdAt,
    };
  }

  static toDetails(row: RoomDetailsRow): ReadingRoomDetailsReadModel {
    return {
      roomId: row.id,
      bookId: row.bookId,
      hostId: row.hostId,
      mode: requireRoomMode(row.mode),
      status: requireRoomStatus(row.status),
      currentChapterId: row.currentChapterId,
      currentChapterSlug: row.chapter.slug,
      maxMembers: row.maxMembers,
      createdAt: row.createdAt,
      activeMembers: row.members.map((member) => ({
        userId: member.userId,
        role: requireMemberRole(member.role),
      })),
    };
  }

  static toActiveSummary(row: ActiveSummaryRow): ReadingRoomReadModel {
    return {
      ...toSummaryFields(row),
      membersCount: row.members.length,
      members: row.members.map((member) => ({
        userId: member.userId,
        role: requireMemberRole(member.role),
      })),
    };
  }

  static toHistorySummary(row: HistorySummaryRow): ReadingRoomReadModel {
    return {
      ...toSummaryFields(row),
      membersCount: row.members.length,
      members: row.members.map((member) => ({
        userId: member.userId,
        role: requireMemberRole(member.role),
      })),
    };
  }
}

function toSummaryFields(
  row: ActiveSummaryRow | HistorySummaryRow,
): Omit<ReadingRoomReadModel, 'membersCount' | 'members'> {
  return {
    roomId: row.id,
    bookId: row.bookId,
    hostId: row.hostId,
    mode: requireRoomMode(row.mode),
    status: requireRoomStatus(row.status),
    currentChapterId: row.currentChapterId,
    currentChapterSlug: row.chapter.slug,
    maxMembers: row.maxMembers,
    createdAt: row.createdAt,
  };
}

function requireRoomMode(value: string): 'sync' | 'free' {
  if (value === 'sync' || value === 'free') return value;
  throw new Error(`Invalid persisted reading room mode: ${value}`);
}

function requireRoomStatus(value: string): 'active' | 'ended' {
  if (value === 'active' || value === 'ended') return value;
  throw new Error(`Invalid persisted reading room status: ${value}`);
}

function requireMemberRole(value: string): 'host' | 'member' {
  if (value === 'host' || value === 'member') return value;
  throw new Error(`Invalid persisted reading room member role: ${value}`);
}
