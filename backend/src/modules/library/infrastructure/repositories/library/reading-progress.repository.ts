import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  ChapterStatus,
  ReadingProgress,
} from '@/modules/library/domain/library/entities/reading-progress.entity';
import { IReadingProgressRepository } from '@/modules/library/domain/library/repositories/reading-progress.repository.interface';
import { BookId } from '@/modules/library/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/modules/library/domain/library/value-objects/chapter-id.vo';
import { UserId } from '@/modules/library/domain/library/value-objects/user-id.vo';

@Injectable()
export class ReadingProgressRepository implements IReadingProgressRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async save(progress: ReadingProgress): Promise<void> {
    const data = {
      bookId: progress.bookId.toString(),
      progress: progress.progress,
      status: progress.status,
      timeSpent: progress.timeSpent,
      lastReadAt: progress.lastReadAt ?? new Date(),
      updatedAt: progress.updatedAt,
    };

    await this.transactionHost.tx.readingProgress.upsert({
      where: {
        userId_chapterId: {
          userId: progress.userId.toString(),
          chapterId: progress.chapterId.toString(),
        },
      },
      create: {
        id: progress.id,
        userId: progress.userId.toString(),
        chapterId: progress.chapterId.toString(),
        ...data,
        createdAt: progress.createdAt,
      },
      update: data,
    });
  }

  async findByUserIdAndChapterId(
    userId: UserId,
    chapterId: ChapterId,
  ): Promise<ReadingProgress | null> {
    const row = await this.transactionHost.tx.readingProgress.findUnique({
      where: {
        userId_chapterId: {
          userId: userId.toString(),
          chapterId: chapterId.toString(),
        },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserIdAndBookId(
    userId: UserId,
    bookId: BookId,
  ): Promise<ReadingProgress[]> {
    const rows = await this.transactionHost.tx.readingProgress.findMany({
      where: { userId: userId.toString(), bookId: bookId.toString() },
      orderBy: [{ lastReadAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async countCompletedByBookIds(
    userId: UserId,
    bookIds: BookId[],
  ): Promise<Map<string, number>> {
    if (bookIds.length === 0) return new Map();

    const rows = await this.transactionHost.tx.readingProgress.groupBy({
      by: ['bookId'],
      where: {
        userId: userId.toString(),
        bookId: { in: bookIds.map((bookId) => bookId.toString()) },
        status: ChapterStatus.COMPLETED,
      },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.bookId, row._count._all]));
  }

  async remove(userId: UserId, chapterId: ChapterId): Promise<void> {
    await this.transactionHost.tx.readingProgress.deleteMany({
      where: { userId: userId.toString(), chapterId: chapterId.toString() },
    });
  }

  private toDomain(
    row: Prisma.ReadingProgressGetPayload<object>,
  ): ReadingProgress {
    return ReadingProgress.reconstitute({
      id: row.id,
      userId: row.userId,
      bookId: row.bookId,
      chapterId: row.chapterId,
      progress: row.progress,
      status: requireChapterStatus(row.status),
      timeSpent: row.timeSpent,
      lastReadAt: row.lastReadAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

function requireChapterStatus(value: string): ChapterStatus {
  if (value === 'READING') return ChapterStatus.READING;
  if (value === 'COMPLETED') return ChapterStatus.COMPLETED;
  throw new Error(`Invalid persisted chapter status: ${value}`);
}
