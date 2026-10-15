import { Injectable } from '@nestjs/common';
import { Prisma } from '@/core/database/generated/prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import {
  buildPaginationMeta,
  type PaginatedResult,
  type PaginationOptions,
  type SortOptions,
} from '@/shared/domain/pagination.types';
import {
  CommentReadRepository,
  type CommentCountFilter,
  type CommentListFilter,
} from '@/modules/comments/application/ports/comment-read.repository';
import type { CommentReadModel } from '@/modules/comments/application/read-models/comment.read-model';

@Injectable()
export class PrismaCommentReadRepository implements CommentReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async search(
    ability: AppAbility,
    filter: CommentListFilter,
    pagination: PaginationOptions,
    sort: SortOptions<'createdAt' | 'updatedAt'>,
    viewerUserId: string,
  ): Promise<PaginatedResult<CommentReadModel>> {
    const where = {
      AND: [
        accessibleBy(ability).ofType('Comment'),
        {
          targetId: filter.targetId,
          isDeleted: false,
          ...(filter.parentId === undefined
            ? {}
            : { parentId: filter.parentId }),
        },
      ],
    } satisfies Prisma.CommentWhereInput;
    const sortField = sort.sortBy ?? 'createdAt';
    const direction = sort.order ?? 'desc';
    const orderBy =
      sortField === 'updatedAt'
        ? { updatedAt: direction }
        : { createdAt: direction };
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.comment.findMany({
        where,
        orderBy: [orderBy, { id: 'desc' }],
        skip: (pagination.page - 1) * pagination.limit,
        take: Math.min(Math.max(pagination.limit, 1), 100),
        include: {
          user: { select: { id: true, username: true, image: true } },
          _count: { select: { replies: { where: { isDeleted: false } } } },
        },
      }),
      this.transactionHost.tx.comment.count({ where }),
    ]);
    const likedIds =
      viewerUserId === 'anonymous' || rows.length === 0
        ? new Set<string>()
        : new Set(
            (
              await this.transactionHost.tx.like.findMany({
                where: {
                  userId: viewerUserId,
                  targetType: 'comment',
                  targetId: { in: rows.map((row) => row.id) },
                  status: true,
                },
                select: { targetId: true },
              })
            ).map((like) => like.targetId),
          );

    return {
      data: rows.map((row) => ({
        id: row.id,
        content: row.content,
        targetId: row.targetId,
        targetType: row.targetType,
        parentId: row.parentId,
        likesCount: row.likesCount,
        repliesCount: row._count.replies,
        isLiked: likedIds.has(row.id),
        isFlagged: row.isFlagged,
        moderationStatus: row.moderationStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.user.id,
          username: row.user.username,
          image: row.user.image ?? '',
        },
      })),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  count(ability: AppAbility, filter: CommentCountFilter): Promise<number> {
    return this.transactionHost.tx.comment.count({
      where: {
        AND: [
          accessibleBy(ability).ofType('Comment'),
          {
            targetId: filter.targetId,
            targetType: filter.targetType,
            isDeleted: false,
            ...(filter.parentId === undefined
              ? {}
              : { parentId: filter.parentId }),
          },
        ],
      },
    });
  }
}
