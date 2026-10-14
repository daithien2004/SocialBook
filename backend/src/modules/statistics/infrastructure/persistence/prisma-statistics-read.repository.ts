import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { StatisticsReadRepository } from '@/modules/statistics/application/ports/statistics-read.repository';
import type {
  BookStatsReadModel,
  ChapterEngagementReadModel,
  GeographicReadModel,
  GrowthMetricReadModel,
  OverviewStatsReadModel,
  ReadingHeatmapReadModel,
  ReadingSpeedReadModel,
  UserLocationSummaryReadModel,
  UserStatsReadModel,
} from '@/modules/statistics/application/read-models/statistics.read-model';
import { StatisticsReadMapper } from './statistics-read.mapper';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class PrismaStatisticsReadRepository implements StatisticsReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  /** Reporting intentionally reads across feature-owned tables in one read adapter. */
  async getOverviewStats(
    recentSince: Date,
    previousSince: Date,
  ): Promise<OverviewStatsReadModel> {
    const client = this.transactionHost.tx;
    const [
      totalUsers,
      activeUsers,
      banned,
      totalBooks,
      totalChapters,
      totalPosts,
      activePosts,
      comments,
      reviews,
      previousMonthUsers,
    ] = await Promise.all([
      client.user.count(),
      client.user.count({ where: { createdAt: { gte: recentSince } } }),
      client.user.count({ where: { isBanned: true } }),
      client.book.count({ where: { isDeleted: false } }),
      client.chapter.count({ where: { isDeleted: false } }),
      client.post.count(),
      client.post.count({ where: { isDeleted: false } }),
      client.comment.count({ where: { isDeleted: false } }),
      client.review.count(),
      client.user.count({
        where: { createdAt: { gte: previousSince, lt: recentSince } },
      }),
    ]);
    const growth =
      previousMonthUsers > 0
        ? ((activeUsers - previousMonthUsers) / previousMonthUsers) * 100
        : 100;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        banned,
        growth: Math.round(growth * 10) / 10,
      },
      books: { total: totalBooks, chapters: totalChapters },
      posts: { total: totalPosts, active: activePosts },
      comments,
      reviews,
    };
  }

  async getUserStats(recentSince: Date): Promise<UserStatsReadModel> {
    const client = this.transactionHost.tx;
    const [total, verified, banned, providers, rawRegistrations] =
      await Promise.all([
        client.user.count(),
        client.user.count({ where: { isVerified: true } }),
        client.user.count({ where: { isBanned: true } }),
        client.user.groupBy({ by: ['provider'], _count: { _all: true } }),
        client.$queryRaw<unknown[]>(Prisma.sql`
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
               COUNT(*)::integer AS count
        FROM "users"
        WHERE "createdAt" >= ${recentSince}
        GROUP BY 1 ORDER BY 1 ASC
      `),
      ]);
    const counts = new Map(
      providers.map((provider) => [provider.provider, provider._count._all]),
    );

    return {
      total,
      verified,
      banned,
      byProvider: {
        local: counts.get('local') ?? 0,
        google: counts.get('google') ?? 0,
        facebook: counts.get('facebook') ?? 0,
      },
      recentRegistrations:
        StatisticsReadMapper.toRegistrationRows(rawRegistrations),
    };
  }

  async getBookStats(): Promise<BookStatsReadModel> {
    const client = this.transactionHost.tx;
    const [total, totalChapters, genreCounts, popularBooks] = await Promise.all(
      [
        client.book.count({ where: { isDeleted: false } }),
        client.chapter.count({ where: { isDeleted: false } }),
        client.bookGenre.groupBy({
          by: ['genreId'],
          where: { book: { isDeleted: false } },
          _count: { _all: true },
        }),
        client.book.findMany({
          where: { isDeleted: false },
          orderBy: [{ likes: 'desc' }, { id: 'asc' }],
          take: 10,
          select: {
            id: true,
            title: true,
            slug: true,
            views: true,
            likes: true,
          },
        }),
      ],
    );
    const genres = await client.genre.findMany({
      where: { id: { in: genreCounts.map(({ genreId }) => genreId) } },
      select: { id: true, name: true },
    });
    const countsByGenre = new Map(
      genreCounts.map((item) => [item.genreId, item._count._all]),
    );

    return {
      total,
      totalChapters,
      byGenre: genres
        .map((genre) => ({
          genres: genre.name,
          count: countsByGenre.get(genre.id) ?? 0,
        }))
        .sort((left, right) => right.count - left.count),
      popularBooks: popularBooks.map((book) => ({
        id: book.id,
        title: book.title,
        slug: book.slug,
        stats: { views: book.views, likes: book.likes },
      })),
    };
  }

  async getGrowthStats(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<GrowthMetricReadModel[]> {
    const client = this.transactionHost.tx;
    const format =
      groupBy === 'year'
        ? 'YYYY'
        : groupBy === 'month'
          ? 'YYYY-MM'
          : 'YYYY-MM-DD';
    const [users, books, posts] = await Promise.all([
      client.$queryRaw<unknown[]>(
        Prisma.sql`SELECT to_char(date_trunc(${groupBy}, "createdAt"), ${format}) AS bucket, COUNT(*)::integer AS count FROM "users" WHERE "createdAt" >= ${startDate} GROUP BY 1`,
      ),
      client.$queryRaw<unknown[]>(
        Prisma.sql`SELECT to_char(date_trunc(${groupBy}, "createdAt"), ${format}) AS bucket, COUNT(*)::integer AS count FROM "books" WHERE "createdAt" >= ${startDate} AND "isDeleted" = false GROUP BY 1`,
      ),
      client.$queryRaw<unknown[]>(
        Prisma.sql`SELECT to_char(date_trunc(${groupBy}, "createdAt"), ${format}) AS bucket, COUNT(*)::integer AS count FROM "posts" WHERE "createdAt" >= ${startDate} GROUP BY 1`,
      ),
    ]);
    const byDate = new Map<string, GrowthMetricReadModel>();
    const merge = (rows: unknown[], metric: 'users' | 'books' | 'posts') => {
      for (const row of rows) {
        if (!isRecord(row)) {
          throw new Error('Unexpected PostgreSQL growth row');
        }
        const date = row.bucket;
        const count = row.count;
        if (typeof date !== 'string' || typeof count !== 'number') {
          throw new Error('Invalid PostgreSQL growth row');
        }
        const existing = byDate.get(date) ?? {
          date,
          users: 0,
          books: 0,
          posts: 0,
        };
        existing[metric] = count;
        byDate.set(date, existing);
      }
    };
    merge(users, 'users');
    merge(books, 'books');
    merge(posts, 'posts');
    return Array.from(byDate.values()).sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  async getGeographicDistribution(): Promise<GeographicReadModel[]> {
    const groups = await this.transactionHost.tx.user.groupBy({
      by: ['location'],
      where: { location: { not: null, notIn: ['', 'null', 'undefined'] } },
      _count: { _all: true },
      orderBy: { _count: { location: 'desc' } },
      take: 20,
    });
    return groups.flatMap((group) =>
      group.location === null
        ? []
        : [{ country: group.location, userCount: group._count._all }],
    );
  }

  async checkUserLocations(): Promise<UserLocationSummaryReadModel> {
    const where = { location: { not: null, notIn: ['', 'null', 'undefined'] } };
    const [totalUsers, usersWithLocation, sampleUsers] = await Promise.all([
      this.transactionHost.tx.user.count(),
      this.transactionHost.tx.user.count({ where }),
      this.transactionHost.tx.user.findMany({
        where,
        take: 5,
        select: { username: true, location: true },
      }),
    ]);
    return {
      totalUsers,
      usersWithLocation,
      sampleUsers: sampleUsers.flatMap((user) =>
        user.location === null
          ? []
          : [{ username: user.username, location: user.location }],
      ),
    };
  }

  async getReadingHeatmap(): Promise<ReadingHeatmapReadModel[]> {
    const rows = await this.transactionHost.tx.$queryRaw<unknown[]>(Prisma.sql`
      SELECT
        EXTRACT(HOUR FROM ("lastReadAt" + INTERVAL '7 hours'))::integer AS hour,
        COUNT(*)::integer AS count
      FROM "reading_progress"
      GROUP BY hour
      ORDER BY hour
    `);
    return StatisticsReadMapper.toReadingHeatmap(rows);
  }

  async getChapterEngagement(
    limit = 10,
  ): Promise<ChapterEngagementReadModel[]> {
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
    return StatisticsReadMapper.toChapterEngagement(rows);
  }

  async getReadingSpeed(days = 30): Promise<ReadingSpeedReadModel[]> {
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
    return StatisticsReadMapper.toReadingSpeed(rows);
  }

  countActiveUsers(since: Date): Promise<number> {
    return this.transactionHost.tx.readingProgress.count({
      where: { lastReadAt: { gte: since } },
    });
  }
}
