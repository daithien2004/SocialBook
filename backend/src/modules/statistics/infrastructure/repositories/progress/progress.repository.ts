import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { IProgressRepository } from '@/modules/statistics/domain/repositories/progress.repository.interface';
import {
  ChapterEngagementData,
  ReadingHeatmapData,
  ReadingSpeedData,
} from '@/modules/statistics/domain/read-models/statistics.model';

@Injectable()
export class ProgressRepository implements IProgressRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async getReadingHeatmap(): Promise<ReadingHeatmapData[]> {
    const rows = await this.transactionHost.tx.$queryRaw<unknown[]>(Prisma.sql`
      SELECT
        EXTRACT(HOUR FROM ("lastReadAt" + INTERVAL '7 hours'))::integer AS hour,
        COUNT(*)::integer AS count
      FROM "reading_progress"
      GROUP BY hour
      ORDER BY hour
    `);
    const counts = new Map(
      rows.map((value) => {
        const row = requireRecord(value);
        return [
          requireInteger(row.get('hour'), 'hour'),
          requireInteger(row.get('count'), 'count'),
        ];
      }),
    );
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: counts.get(hour) ?? 0,
    }));
  }

  async getChapterEngagement(limit = 10): Promise<ChapterEngagementData[]> {
    const rows = await this.transactionHost.tx.$queryRaw<unknown[]>(Prisma.sql`
      SELECT
        c."id" AS "chapterId",
        c."title" AS "chapterTitle",
        b."title" AS "bookTitle",
        COUNT(*)::integer AS "viewCount",
        ROUND(
          100.0 * COUNT(*) FILTER (
            WHERE p."status" = 'COMPLETED' OR p."progress" >= 60
          ) / NULLIF(COUNT(*), 0),
          1
        )::double precision AS "completionRate",
        ROUND(AVG(p."timeSpent"))::double precision AS "averageTimeSpent"
      FROM "reading_progress" p
      JOIN "chapters" c ON c."id" = p."chapterId"
      JOIN "books" b ON b."id" = c."bookId"
      GROUP BY c."id", c."title", b."title"
      ORDER BY "viewCount" DESC, c."id" ASC
      LIMIT ${Math.max(0, limit)}
    `);
    return rows.map((value) => {
      const row = requireRecord(value);
      return {
        chapterId: requireString(row.get('chapterId'), 'chapterId'),
        chapterTitle: requireString(row.get('chapterTitle'), 'chapterTitle'),
        bookTitle: requireString(row.get('bookTitle'), 'bookTitle'),
        viewCount: requireInteger(row.get('viewCount'), 'viewCount'),
        completionRate:
          Math.round(
            requireNumber(row.get('completionRate'), 'completionRate') * 10,
          ) / 10,
        averageTimeSpent: Math.round(
          requireNumber(row.get('averageTimeSpent'), 'averageTimeSpent'),
        ),
      };
    });
  }

  async getReadingSpeed(days = 30): Promise<ReadingSpeedData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const rows = await this.transactionHost.tx.$queryRaw<unknown[]>(Prisma.sql`
      WITH chapter_word_counts AS (
        SELECT
          "chapterId",
          SUM(
            CASE
              WHEN btrim("content") = '' THEN 0
              ELSE cardinality(regexp_split_to_array(btrim("content"), '\\s+'))
            END
          )::double precision AS words
        FROM "paragraphs"
        GROUP BY "chapterId"
      )
      SELECT
        to_char(p."lastReadAt", 'YYYY-MM-DD') AS date,
        ROUND(
          AVG(COALESCE(w.words, 0) / (p."timeSpent"::double precision / 60.0))
        )::double precision AS "averageSpeed"
      FROM "reading_progress" p
      LEFT JOIN chapter_word_counts w ON w."chapterId" = p."chapterId"
      WHERE p."lastReadAt" >= ${startDate}
        AND p."timeSpent" > 0
      GROUP BY date
      ORDER BY date
    `);
    return rows.map((value) => {
      const row = requireRecord(value);
      return {
        date: requireString(row.get('date'), 'date'),
        averageSpeed: Math.round(
          requireNumber(row.get('averageSpeed'), 'averageSpeed'),
        ),
      };
    });
  }

  countActiveUsers(since: Date): Promise<number> {
    return this.transactionHost.tx.readingProgress.count({
      where: { lastReadAt: { gte: since } },
    });
  }
}

function requireRecord(value: unknown): Map<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Unexpected PostgreSQL statistics row');
  }
  return new Map(Object.entries(value));
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid PostgreSQL statistics field: ${field}`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  throw new Error(`Invalid PostgreSQL statistics field: ${field}`);
}

function requireInteger(value: unknown, field: string): number {
  const number = requireNumber(value, field);
  if (Number.isInteger(number)) return number;
  throw new Error(`Invalid PostgreSQL statistics field: ${field}`);
}
