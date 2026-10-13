import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { UserEvent as UserEventEntity } from '@/modules/analytics/domain/entities/user-event.entity';
import { UserEventType } from '@/modules/analytics/domain/enums/user-event-type.enum';
import { IUserAnalyticsRepository } from '@/modules/analytics/domain/repositories/user-analytics.repository.interface';

const TRENDING_EVENT_TYPES = [
  UserEventType.START_READING,
  UserEventType.FINISH_BOOK,
  UserEventType.RATE_BOOK,
];
const ACTIVE_READER_EVENT_TYPES = [
  UserEventType.FINISH_BOOK,
  UserEventType.READING_PROGRESS,
];

@Injectable()
export class PostgresUserAnalyticsRepository implements IUserAnalyticsRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async saveEvent(event: UserEventEntity): Promise<void> {
    await this.transactionHost.tx.userEvent.upsert({
      where: { id: event.id },
      create: toCreateData(event),
      update: toUpdateData(event),
    });
  }

  async insertManyEvents(events: UserEventEntity[]): Promise<void> {
    if (events.length === 0) return;
    await this.transactionHost.tx.userEvent.createMany({
      data: events.map((event) => toCreateData(event)),
      skipDuplicates: true,
    });
  }

  async updatePreferenceScore(
    userId: string,
    genreId: string,
    delta: number,
  ): Promise<void> {
    await this.transactionHost.tx.userPreference.upsert({
      where: { userId_genreId: { userId, genreId } },
      create: { userId, genreId, score: delta },
      update: { score: { increment: delta } },
    });
  }

  async getTrendingBooks(
    days = 1,
    limit = 5,
  ): Promise<
    {
      bookId: string;
      title: string;
      coverImage: string | null;
      score: number;
    }[]
  > {
    const since = daysAgo(days);
    const grouped = await this.transactionHost.tx.userEvent.groupBy({
      by: ['bookId'],
      where: {
        createdAt: { gte: since },
        eventType: { in: TRENDING_EVENT_TYPES },
        bookId: { not: null },
      },
      _count: { bookId: true },
      orderBy: [{ _count: { bookId: 'desc' } }, { bookId: 'asc' }],
      take: limit,
    });
    const bookIds = grouped.flatMap((row) => (row.bookId ? [row.bookId] : []));
    if (bookIds.length === 0) return [];

    const books = await this.transactionHost.tx.book.findMany({
      where: { id: { in: bookIds }, isDeleted: false },
      select: { id: true, title: true, coverUrl: true },
    });
    const booksById = new Map(books.map((book) => [book.id, book]));

    return grouped.flatMap((row) => {
      if (!row.bookId) return [];
      const book = booksById.get(row.bookId);
      if (!book) return [];
      return [
        {
          bookId: book.id,
          title: book.title,
          coverImage: book.coverUrl || null,
          score: row._count.bookId,
        },
      ];
    });
  }

  async getTopActiveReaders(
    days = 7,
    limit = 5,
  ): Promise<
    { userId: string; username: string; avatar: string | null; score: number }[]
  > {
    const grouped = await this.transactionHost.tx.userEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: daysAgo(days) },
        eventType: { in: ACTIVE_READER_EVENT_TYPES },
      },
      _count: { userId: true },
      orderBy: [{ _count: { userId: 'desc' } }, { userId: 'asc' }],
      take: limit,
    });
    const users = await this.transactionHost.tx.user.findMany({
      where: { id: { in: grouped.map((row) => row.userId) } },
      select: { id: true, username: true, image: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return grouped.flatMap((row) => {
      const user = usersById.get(row.userId);
      if (!user) return [];
      return [
        {
          userId: user.id,
          username: user.username,
          avatar: user.image,
          score: row._count.userId,
        },
      ];
    });
  }

  async deleteEventsBefore(date: Date): Promise<number> {
    const result = await this.transactionHost.tx.userEvent.deleteMany({
      where: { createdAt: { lt: date } },
    });
    return result.count;
  }
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function toCreateData(event: UserEventEntity): Prisma.UserEventCreateManyInput {
  return {
    id: event.id,
    userId: event.userId,
    sessionId: event.sessionId,
    eventType: event.eventType,
    bookId: event.bookId,
    chapterId: event.chapterId,
    durationSeconds: event.durationSeconds,
    progressPercent: event.progressPercent,
    source: event.source,
    deviceType: event.deviceType,
    metadata: toJsonInput(event.metadata),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function toUpdateData(
  event: UserEventEntity,
): Prisma.UserEventUncheckedUpdateInput {
  return {
    userId: event.userId,
    sessionId: event.sessionId,
    eventType: event.eventType,
    bookId: event.bookId,
    chapterId: event.chapterId,
    durationSeconds: event.durationSeconds,
    progressPercent: event.progressPercent,
    source: event.source,
    deviceType: event.deviceType,
    metadata: toJsonInput(event.metadata),
    updatedAt: event.updatedAt,
  };
}

function toJsonInput(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (!value) return undefined;
  const serialized = JSON.stringify(value);
  const parsed: unknown = JSON.parse(serialized);
  if (!isJsonValue(parsed)) throw new Error('Event metadata is not valid JSON');
  return parsed;
}

function isJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value !== 'object') return false;
  return Object.values(value).every(isJsonValue);
}
