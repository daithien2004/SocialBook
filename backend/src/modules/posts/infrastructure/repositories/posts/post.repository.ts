import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Prisma } from '@/core/database/generated/prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { ConcurrencyException } from '@/shared/domain/common-exceptions';
import {
  buildPaginationMeta,
  CursorPaginatedResult,
  PaginatedResult,
} from '@/shared/domain/pagination.types';
import { Post as PostEntity } from '@/modules/posts/domain/posts/entities/post.entity';
import {
  FindAllOptions,
  FindFlaggedOptions,
  IPostRepository,
} from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { PostMapper, postRelations, PostWithRelations } from './post.mapper';

const personalizedPostRowSchema = z.object({
  id: z.string(),
  score: z.coerce.number(),
});
const growthMetricSchema = z.object({
  bucket: z.string(),
  count: z.coerce.number(),
});

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async create(post: PostEntity): Promise<PostEntity> {
    const row = await this.transactionHost.tx.post.create({
      data: {
        id: post.id,
        userId: post.userId,
        bookId: post.bookId,
        content: post.content,
        imageUrls: post.imageUrls,
        isDeleted: post.isDeleted,
        isFlagged: post.isFlagged,
        moderationReason: post.moderationReason ?? null,
        moderationStatus: post.moderationStatus ?? 'pending',
      },
      include: postRelations,
    });
    const domain = PostMapper.toDomain(row);
    domain.markPersisted(row.version);
    return domain;
  }

  async update(post: PostEntity): Promise<PostEntity> {
    const result = await this.transactionHost.tx.post.updateMany({
      where: { id: post.id, version: post.loadedVersion },
      data: {
        bookId: post.bookId,
        content: post.content,
        imageUrls: post.imageUrls,
        isDeleted: post.isDeleted,
        isFlagged: post.isFlagged,
        moderationReason: post.moderationReason ?? null,
        moderationStatus: post.moderationStatus ?? 'pending',
        version: { increment: 1 },
      },
    });
    if (result.count === 0)
      throw new ConcurrencyException('Post changed after it was loaded');
    const row = await this.transactionHost.tx.post.findUnique({
      where: { id: post.id },
      include: postRelations,
    });
    if (!row)
      throw new ConcurrencyException('Post disappeared after it was updated');
    return PostMapper.toDomain(row);
  }

  async findById(
    id: string,
    viewerUserId?: string,
  ): Promise<PostEntity | null> {
    const row = await this.transactionHost.tx.post.findFirst({
      where: { id, isDeleted: false },
      include: postRelations,
    });
    if (!row) return null;
    const [enriched] = await this.enrichPosts([row], viewerUserId);
    return enriched ?? null;
  }

  async findAll(
    options: FindAllOptions,
  ): Promise<CursorPaginatedResult<PostEntity>> {
    if (options.viewerUserId && !options.userId)
      return this.findPersonalized(options);
    const where: Prisma.PostWhereInput = {
      isDeleted: false,
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.isFlagged !== undefined
        ? { isFlagged: options.isFlagged }
        : !(options.userId && options.viewerUserId === options.userId)
          ? { isFlagged: false }
          : {}),
      ...(options.cursor
        ? {
            id: {
              lt: options.cursor.includes('_')
                ? options.cursor.split('_').at(-1)
                : options.cursor,
            },
          }
        : {}),
    };
    const rows = await this.transactionHost.tx.post.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      take: options.limit + 1,
      include: postRelations,
    });
    const hasMore = rows.length > options.limit;
    const pageRows = rows.slice(0, options.limit);
    const data = await this.enrichPosts(pageRows, options.viewerUserId);
    return {
      data,
      meta: {
        limit: options.limit,
        nextCursor: hasMore ? (pageRows.at(-1)?.id ?? null) : null,
        hasMore,
      },
    };
  }

  private async findPersonalized(
    options: FindAllOptions,
  ): Promise<CursorPaginatedResult<PostEntity>> {
    const viewerUserId = options.viewerUserId;
    if (!viewerUserId)
      return {
        data: [],
        meta: { limit: options.limit, nextCursor: null, hasMore: false },
      };
    const cursorParts = options.cursor?.split('_') ?? [];
    let cursorScore: number | null = null;
    let cursorId: string | null = null;
    if (cursorParts.length > 1) {
      const parsed = Number(cursorParts[0]);
      if (Number.isFinite(parsed)) {
        cursorScore = parsed;
        cursorId = cursorParts.slice(1).join('_');
      }
    } else if (options.cursor) {
      const cursorPost = await this.transactionHost.tx.post.findUnique({
        where: { id: options.cursor },
        select: { id: true, createdAt: true },
      });
      if (cursorPost) {
        const ageHours =
          (Date.now() - cursorPost.createdAt.getTime()) / 3_600_000;
        cursorScore = 1 / Math.pow(ageHours + 2, 1.5);
        cursorId = cursorPost.id;
      }
    }
    const cursorFilter =
      cursorScore !== null && cursorId !== null
        ? Prisma.sql`WHERE ranked.score < ${cursorScore} OR (ranked.score = ${cursorScore} AND ranked.id < ${cursorId})`
        : Prisma.empty;
    const rawRows = await this.transactionHost.tx.$queryRaw<
      unknown[]
    >(Prisma.sql`
      WITH ranked AS (
        SELECT p."id",
          (
            1
            + COALESCE((SELECT SUM(up."score") FROM "book_genres" bg JOIN "user_preferences" up ON up."genreId" = bg."genreId" WHERE bg."bookId" = p."bookId" AND up."userId" = ${viewerUserId}), 0)
            + CASE WHEN EXISTS (SELECT 1 FROM "follows" f WHERE f."userId" = ${viewerUserId} AND f."targetId" = p."userId" AND f."status" = true AND f."isDeleted" = false) THEN 100 ELSE 0 END
            + (SELECT COUNT(*) FROM "likes" l WHERE l."targetType" = 'post' AND l."targetId" = p."id" AND l."status" = true)
            + 3 * (SELECT COUNT(*) FROM "comments" c WHERE c."targetType" = 'post' AND c."targetId" = p."id" AND c."isDeleted" = false)
          ) / POWER((EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p."createdAt")) / 3600 + 2), 1.5) AS score
        FROM "posts" p WHERE p."isDeleted" = false AND p."isFlagged" = false
      )
      SELECT ranked."id", ranked.score FROM ranked ${cursorFilter}
      ORDER BY ranked.score DESC, ranked."id" DESC LIMIT ${options.limit + 1}
    `);
    const ranks = z.array(personalizedPostRowSchema).parse(rawRows);
    const hasMore = ranks.length > options.limit;
    const pageRanks = ranks.slice(0, options.limit);
    const rows = await this.transactionHost.tx.post.findMany({
      where: { id: { in: pageRanks.map((rank) => rank.id) } },
      include: postRelations,
    });
    const rowById = new Map(rows.map((row) => [row.id, row]));
    const orderedRows = pageRanks.flatMap((rank) => {
      const row = rowById.get(rank.id);
      return row ? [{ row, score: rank.score }] : [];
    });
    const data = await this.enrichPosts(
      orderedRows.map(({ row }) => row),
      viewerUserId,
    );
    return {
      data,
      meta: {
        limit: options.limit,
        nextCursor: hasMore
          ? `${orderedRows.at(-1)?.score ?? 0}_${orderedRows.at(-1)?.row.id ?? ''}`
          : null,
        hasMore,
      },
    };
  }

  async delete(id: string, expectedVersion: number): Promise<void> {
    const result = await this.transactionHost.tx.post.deleteMany({
      where: { id, version: expectedVersion },
    });
    if (!result.count)
      throw new ConcurrencyException('Post changed before it was deleted');
  }

  async softDelete(id: string, expectedVersion: number): Promise<void> {
    const result = await this.transactionHost.tx.post.updateMany({
      where: { id, version: expectedVersion },
      data: { isDeleted: true, version: { increment: 1 } },
    });
    if (!result.count)
      throw new ConcurrencyException('Post changed before it was deleted');
  }

  async findFlagged(
    options: FindFlaggedOptions,
  ): Promise<PaginatedResult<PostEntity>> {
    const where: Prisma.PostWhereInput = {
      isFlagged: true,
      isDeleted: false,
      ...(options.reason
        ? {
            moderationReason: { contains: options.reason, mode: 'insensitive' },
          }
        : {}),
      ...(options.startDate || options.endDate
        ? {
            createdAt: {
              ...(options.startDate ? { gte: options.startDate } : {}),
              ...(options.endDate ? { lte: options.endDate } : {}),
            },
          }
        : {}),
    };
    const orderBy: Prisma.PostOrderByWithRelationInput =
      options.sortBy === 'violations'
        ? { user: { violationCount: 'desc' } }
        : { createdAt: options.sortBy === 'oldest' ? 'asc' : 'desc' };
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.post.findMany({
        where,
        orderBy: [orderBy, { id: 'desc' }],
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        include: postRelations,
      }),
      this.transactionHost.tx.post.count({ where }),
    ]);
    return {
      data: rows.map((row) => PostMapper.toDomain(row)),
      meta: buildPaginationMeta(options.page, options.limit, total),
    };
  }

  async getModerationStats(): Promise<{
    total: number;
    toxic: number;
    spoiler: number;
    other: number;
  }> {
    const where = { isFlagged: true, isDeleted: false };
    const [total, toxic, spoiler] = await Promise.all([
      this.transactionHost.tx.post.count({ where }),
      this.transactionHost.tx.post.count({
        where: {
          ...where,
          OR: [
            { moderationReason: { contains: 'toxic', mode: 'insensitive' } },
            { moderationReason: { contains: 'thô tục', mode: 'insensitive' } },
          ],
        },
      }),
      this.transactionHost.tx.post.count({
        where: {
          ...where,
          OR: [
            { moderationReason: { contains: 'spoiler', mode: 'insensitive' } },
            { moderationReason: { contains: 'tiết lộ', mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    return {
      total,
      toxic,
      spoiler,
      other: Math.max(0, total - toxic - spoiler),
    };
  }

  countByUser(userId: string): Promise<number> {
    return this.transactionHost.tx.post.count({
      where: { userId, isDeleted: false, isFlagged: false },
    });
  }

  countTotal(): Promise<number> {
    return this.transactionHost.tx.post.count();
  }
  countActive(): Promise<number> {
    return this.transactionHost.tx.post.count({ where: { isDeleted: false } });
  }

  async getGrowthMetrics(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<Array<{ period: string; count: number }>> {
    const format =
      groupBy === 'year'
        ? 'YYYY'
        : groupBy === 'month'
          ? 'YYYY-MM'
          : 'YYYY-MM-DD';
    const raw = await this.transactionHost.tx.$queryRaw<unknown[]>(Prisma.sql`
      SELECT to_char(date_trunc(${groupBy}, "createdAt"), ${format}) AS bucket, COUNT(*)::integer AS count
      FROM "posts" WHERE "createdAt" >= ${startDate}
      GROUP BY date_trunc(${groupBy}, "createdAt") ORDER BY date_trunc(${groupBy}, "createdAt") ASC
    `);
    return z
      .array(growthMetricSchema)
      .parse(raw)
      .map((row) => ({ period: row.bucket, count: row.count }));
  }

  private async enrichPosts(
    rows: PostWithRelations[],
    viewerUserId?: string,
  ): Promise<PostEntity[]> {
    if (!rows.length) return [];
    const ids = rows.map((row) => row.id);
    const [likeGroups, commentGroups, viewerLikes] = await Promise.all([
      this.transactionHost.tx.like.groupBy({
        by: ['targetId'],
        where: { targetType: 'post', targetId: { in: ids }, status: true },
        _count: { _all: true },
      }),
      this.transactionHost.tx.comment.groupBy({
        by: ['targetId'],
        where: { targetType: 'post', targetId: { in: ids }, isDeleted: false },
        _count: { _all: true },
      }),
      viewerUserId
        ? this.transactionHost.tx.like.findMany({
            where: {
              userId: viewerUserId,
              targetType: 'post',
              targetId: { in: ids },
              status: true,
            },
            select: { targetId: true },
          })
        : Promise.resolve([]),
    ]);
    const likesById = new Map(
      likeGroups.map((item) => [item.targetId, item._count._all]),
    );
    const commentsById = new Map(
      commentGroups.map((item) => [item.targetId, item._count._all]),
    );
    const likedIds = new Set(viewerLikes.map((item) => item.targetId));
    return rows.map((row) =>
      PostMapper.toDomain(row, {
        likesCount: likesById.get(row.id) ?? 0,
        commentsCount: commentsById.get(row.id) ?? 0,
        likedByCurrentUser: likedIds.has(row.id),
      }),
    );
  }
}
