import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import type {
  ReadingRoomHighlightReadModel,
  ReadingRoomDetailsReadModel,
  ReadingRoomReadModel,
} from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { AppAbility } from '@/shared/casl/app-ability';
import { accessibleBy } from '@/shared/casl/accessible-by';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';
import {
  ACTIVE_SUMMARY_SELECT,
  HIGHLIGHT_SELECT,
  HISTORY_SUMMARY_SELECT,
  ReadingRoomMapper,
  ROOM_DETAILS_SELECT,
} from './reading-room.mapper';

// Read-only chapter joins keep room responses current without coupling the write aggregate to Chapter.

@Injectable()
export class PrismaReadingRoomQueryRepository implements ReadingRoomQueryRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findHighlightById(
    roomId: string,
    highlightId: string,
    userId: string,
    ability: AppAbility,
  ): Promise<ReadingRoomHighlightReadModel | null> {
    const room = await this.transactionHost.tx.readingRoom.findFirst({
      where: {
        AND: [
          { id: roomId },
          accessibleBy(ability).ofType('ReadingRoom'),
          { members: { some: { userId, leftAt: null } } },
        ],
      },
      select: {
        highlights: {
          where: { id: highlightId },
          select: HIGHLIGHT_SELECT,
          take: 1,
        },
      },
    });
    const highlight = room?.highlights[0];
    return highlight ? ReadingRoomMapper.toHighlightReadModel(highlight) : null;
  }

  async findHighlightPage(
    roomId: string,
    userId: string,
    { offset, limit }: PageParams,
    ability: AppAbility,
  ): Promise<PageResult<ReadingRoomHighlightReadModel> | null> {
    const room = await this.transactionHost.tx.readingRoom.findFirst({
      where: {
        AND: [
          { id: roomId },
          accessibleBy(ability).ofType('ReadingRoom'),
          { members: { some: { userId, leftAt: null } } },
        ],
      },
      select: {
        highlights: {
          select: HIGHLIGHT_SELECT,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip: offset,
          take: limit,
        },
        _count: { select: { highlights: true } },
      },
    });
    if (!room) return null;

    return {
      items: room.highlights.map((highlight) =>
        ReadingRoomMapper.toHighlightReadModel(highlight),
      ),
      total: room._count.highlights,
    };
  }

  async findDetailsById(
    roomId: string,
    ability: AppAbility,
  ): Promise<ReadingRoomDetailsReadModel | null> {
    const row = await this.transactionHost.tx.readingRoom.findFirst({
      where: {
        AND: [{ id: roomId }, accessibleBy(ability).ofType('ReadingRoom')],
      },
      select: ROOM_DETAILS_SELECT,
    });
    return row ? ReadingRoomMapper.toDetails(row) : null;
  }

  findActiveSummariesByUser(
    userId: string,
    page: PageParams,
    ability: AppAbility,
  ): Promise<PageResult<ReadingRoomReadModel>> {
    const where: Prisma.ReadingRoomWhereInput = {
      AND: [
        accessibleBy(ability).ofType('ReadingRoom'),
        { status: 'active', members: { some: { userId, leftAt: null } } },
      ],
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
        return rows.map((row) => ReadingRoomMapper.toActiveSummary(row));
      },
      () => this.transactionHost.tx.readingRoom.count({ where }),
    );
  }

  findHistorySummariesByUser(
    userId: string,
    page: PageParams,
    ability: AppAbility,
  ): Promise<PageResult<ReadingRoomReadModel>> {
    const where: Prisma.ReadingRoomWhereInput = {
      AND: [
        accessibleBy(ability).ofType('ReadingRoom'),
        { status: 'ended', members: { some: { userId } } },
      ],
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
        return rows.map((row) => ReadingRoomMapper.toHistorySummary(row));
      },
      () => this.transactionHost.tx.readingRoom.count({ where }),
    );
  }
}
