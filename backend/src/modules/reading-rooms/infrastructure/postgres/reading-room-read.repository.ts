import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import type { ReadingRoomDetailsReadModel } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import type {
  ReadingRoomHighlightResult,
  ReadingRoomResult,
} from '@/modules/reading-rooms/application/reading-room.result';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';

const ROOM_DETAILS_SELECT = {
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
    select: { userId: true, role: true, leftAt: true },
  },
} satisfies Prisma.ReadingRoomSelect;

const ACTIVE_SUMMARY_SELECT = {
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

const HISTORY_SUMMARY_SELECT = {
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
  members: { select: { userId: true, role: true } },
} satisfies Prisma.ReadingRoomSelect;

type RoomDetailsRow = Prisma.ReadingRoomGetPayload<{
  select: typeof ROOM_DETAILS_SELECT;
}>;

type ActiveSummaryRow = Prisma.ReadingRoomGetPayload<{
  select: typeof ACTIVE_SUMMARY_SELECT;
}>;

type HistorySummaryRow = Prisma.ReadingRoomGetPayload<{
  select: typeof HISTORY_SUMMARY_SELECT;
}>;

@Injectable()
export class ReadingRoomReadRepository implements IReadingRoomReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findHighlightPage(
    roomId: string,
    userId: string,
    { offset, limit }: PageParams,
  ): Promise<PageResult<ReadingRoomHighlightResult> | null> {
    const membership =
      await this.transactionHost.tx.readingRoomMember.findUnique({
        where: { roomId_userId: { roomId, userId } },
        select: { leftAt: true },
      });
    if (!membership || membership.leftAt !== null) return null;

    const where = { roomId };
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.readingRoomHighlight.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.transactionHost.tx.readingRoomHighlight.count({ where }),
    ]);

    return {
      items: rows.map((highlight) => ({
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
      total,
    };
  }

  async findDetailsById(
    roomId: string,
  ): Promise<ReadingRoomDetailsReadModel | null> {
    const row = await this.transactionHost.tx.readingRoom.findUnique({
      where: { id: roomId },
      select: ROOM_DETAILS_SELECT,
    });
    return row ? this.toDetails(row) : null;
  }

  findActiveSummariesByUser(
    userId: string,
    page: PageParams,
  ): Promise<PageResult<ReadingRoomResult>> {
    const where: Prisma.ReadingRoomWhereInput = {
      status: 'active',
      members: { some: { userId, leftAt: null } },
    };
    return findPaginated(
      async () => {
        const rows = await this.transactionHost.tx.readingRoom.findMany({
          where,
          select: ACTIVE_SUMMARY_SELECT,
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          skip: page.offset,
          take: page.limit,
        });
        return rows.map((row) => this.toActiveSummary(row));
      },
      () => this.transactionHost.tx.readingRoom.count({ where }),
    );
  }

  findHistorySummariesByUser(
    userId: string,
    page: PageParams,
  ): Promise<PageResult<ReadingRoomResult>> {
    const where: Prisma.ReadingRoomWhereInput = {
      status: 'ended',
      members: { some: { userId } },
    };
    return findPaginated(
      async () => {
        const rows = await this.transactionHost.tx.readingRoom.findMany({
          where,
          select: HISTORY_SUMMARY_SELECT,
          orderBy: [{ endedAt: 'desc' }, { id: 'desc' }],
          skip: page.offset,
          take: page.limit,
        });
        return rows.map((row) => this.toHistorySummary(row));
      },
      () => this.transactionHost.tx.readingRoom.count({ where }),
    );
  }

  private toDetails(row: RoomDetailsRow): ReadingRoomDetailsReadModel {
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
      members: row.members.map((member) => ({
        userId: member.userId,
        role: requireMemberRole(member.role),
        leftAt: member.leftAt,
      })),
    };
  }

  private toActiveSummary(row: ActiveSummaryRow): ReadingRoomResult {
    return {
      ...this.toSummaryFields(row),
      membersCount: row.members.length,
      members: row.members.map((member) => ({
        userId: member.userId,
        role: requireMemberRole(member.role),
      })),
    };
  }

  private toHistorySummary(row: HistorySummaryRow): ReadingRoomResult {
    return {
      ...this.toSummaryFields(row),
      membersCount: row.members.length,
      members: row.members.map((member) => ({
        userId: member.userId,
        role: requireMemberRole(member.role),
      })),
    };
  }

  private toSummaryFields(
    row: ActiveSummaryRow | HistorySummaryRow,
  ): Omit<ReadingRoomResult, 'membersCount' | 'members'> {
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
