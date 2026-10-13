import { Prisma } from '@/core/database/generated/prisma/client';
import { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { RoomMember } from '@/modules/reading-rooms/domain/entities/room-member.entity';

export const READING_ROOM_WITH_STATE = {
  members: { orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }] },
  highlights: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.ReadingRoomInclude;

export type ReadingRoomWithState = Prisma.ReadingRoomGetPayload<{
  include: typeof READING_ROOM_WITH_STATE;
}>;

export function toReadingRoomDomain(
  row: ReadingRoomWithState,
): DomainReadingRoom {
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

export function toReadingRoomCreateData(
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

export function toReadingRoomUpdateData(
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

export function toMemberPersistence(member: RoomMember) {
  return {
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt,
    leftAt: member.leftAt ?? null,
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
