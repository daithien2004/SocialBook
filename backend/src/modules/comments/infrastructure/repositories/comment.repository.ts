import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Comment as CommentEntity } from '@/modules/comments/domain/entities/comment.entity';
import { CommentModel } from '@/modules/comments/domain/read-models/comment-model';
import {
  CommentFilter,
  ICommentRepository,
  ParentResolutionResult,
} from '@/modules/comments/domain/repositories/comment.repository.interface';
import { CommentDepth } from '@/modules/comments/domain/value-objects/comment-depth.vo';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { CommentTargetType } from '@/modules/comments/domain/value-objects/comment-target-type.vo';
import { TargetId } from '@/modules/comments/domain/value-objects/target-id.vo';
import { CommentMapper } from './comment.mapper';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: CommentId): Promise<CommentEntity | null> {
    const row = await this.prisma.comment.findUnique({
      where: { id: id.toString() },
    });
    return row ? CommentMapper.toDomain(row) : null;
  }

  async save(comment: CommentEntity): Promise<void> {
    const data = CommentMapper.toCreateInput(comment);
    await this.prisma.comment.upsert({
      where: { id: comment.id.toString() },
      create: data,
      update: {
        targetType: data.targetType,
        targetId: data.targetId,
        parentId: data.parentId,
        content: data.content,
        likesCount: data.likesCount,
        isFlagged: data.isFlagged,
        moderationReason: data.moderationReason,
        moderationStatus: data.moderationStatus,
        updatedAt: data.updatedAt,
      },
    });
  }

  async delete(id: CommentId): Promise<void> {
    await this.prisma.comment.deleteMany({ where: { id: id.toString() } });
  }

  countByTarget(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: CommentId | null,
  ): Promise<number> {
    return this.prisma.comment.count({
      where: {
        targetId: targetId.toString(),
        targetType: targetType.toString(),
        isDeleted: false,
        ...(parentId === undefined
          ? {}
          : { parentId: parentId?.toString() ?? null }),
      },
    });
  }

  async search(
    filter: CommentFilter,
    pagination: PaginationOptions = { page: 1, limit: 10 },
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const where = {
      targetId: filter.targetId,
      isDeleted: false,
      ...(filter.parentId === undefined ? {} : { parentId: filter.parentId }),
    } satisfies Prisma.CommentWhereInput;
    const orderBy =
      sort?.sortBy === 'updatedAt'
        ? {
            updatedAt:
              sort.order === 'asc' ? ('asc' as const) : ('desc' as const),
          }
        : {
            createdAt:
              sort?.order === 'asc' ? ('asc' as const) : ('desc' as const),
          };
    const [rows, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: [orderBy, { id: 'desc' }],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          user: { select: { id: true, username: true, image: true } },
          _count: { select: { replies: { where: { isDeleted: false } } } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    const likedIds = filter.viewerUserId
      ? new Set(
          (
            await this.prisma.like.findMany({
              where: {
                userId: filter.viewerUserId,
                targetType: 'comment',
                targetId: { in: rows.map((row) => row.id) },
                status: true,
              },
              select: { targetId: true },
            })
          ).map((like) => like.targetId),
        )
      : new Set<string>();
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

  async updateModerationStatus(
    id: CommentId,
    status: 'pending' | 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    await this.prisma.comment.updateMany({
      where: { id: id.toString() },
      data: {
        moderationStatus: status,
        ...(status === 'approved'
          ? { isFlagged: false, moderationReason: '' }
          : {}),
        ...(status === 'rejected'
          ? { isFlagged: true, moderationReason: reason ?? '' }
          : {}),
      },
    });
  }

  async resolveParentId(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: string | null,
  ): Promise<ParentResolutionResult> {
    if (!parentId)
      return { effectiveParentId: null, level: CommentDepth.create(1) };
    const target = await this.prisma.comment.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        targetId: true,
        targetType: true,
        parentId: true,
        isDeleted: true,
      },
    });
    if (!target || target.isDeleted)
      throw new NotFoundException('Parent comment not found');
    if (target.targetId !== targetId.toString())
      throw new ForbiddenException(
        'Parent comment does not belong to this target',
      );
    if (target.targetType !== targetType.toString())
      throw new ForbiddenException('Parent comment target type mismatch');
    if (!target.parentId)
      return { effectiveParentId: target.id, level: CommentDepth.create(2) };
    const parent = await this.prisma.comment.findUnique({
      where: { id: target.parentId },
      select: { id: true, parentId: true, isDeleted: true },
    });
    if (!parent || parent.isDeleted)
      throw new NotFoundException('Parent comment not found');
    return {
      effectiveParentId: parent.parentId ? parent.id : target.id,
      level: CommentDepth.maxAllowed(),
    };
  }

  countTotal(): Promise<number> {
    return this.prisma.comment.count({ where: { isDeleted: false } });
  }
}
