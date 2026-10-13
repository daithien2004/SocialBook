import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { Follow as FollowEntity } from '@/modules/follows/domain/entities/follow.entity';
import {
  FollowFilter,
  FollowStatusResult,
  IFollowRepository,
  PaginatedFollowsWithUserInfo,
} from '@/modules/follows/domain/repositories/follow.repository.interface';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import { FollowMapper, FollowWithUserInfo } from './follow.mapper';

@Injectable()
export class FollowRepository implements IFollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(
    userId: UserId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    return this.paginate(
      { userId: userId.toString(), status: true },
      pagination,
      sort,
    );
  }

  async findByUserWithUserInfo(
    userId: string,
    page = 1,
    limit = 100,
  ): Promise<PaginatedFollowsWithUserInfo> {
    const where = { userId, status: true, isDeleted: false };
    const [rows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          target: {
            select: {
              username: true,
              image: true,
              _count: {
                select: {
                  posts: { where: { isDeleted: false } },
                  readingLists: true,
                  followers: { where: { status: true, isDeleted: false } },
                },
              },
            },
          },
        },
      }),
      this.prisma.follow.count({ where }),
    ]);
    return {
      data: rows.map((row): FollowWithUserInfo => ({
        id: row.id,
        userId: row.userId,
        targetId: row.targetId,
        status: row.status,
        username: row.target.username,
        image: row.target.image ?? undefined,
        postCount: row.target._count.posts,
        readingListCount: row.target._count.readingLists,
        followersCount: row.target._count.followers,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByTargetWithUserInfo(
    targetId: string,
    page = 1,
    limit = 100,
  ): Promise<PaginatedFollowsWithUserInfo> {
    const where = { targetId, status: true, isDeleted: false };
    const [rows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              username: true,
              image: true,
              _count: {
                select: {
                  posts: { where: { isDeleted: false } },
                  readingLists: true,
                  followers: { where: { status: true, isDeleted: false } },
                },
              },
            },
          },
        },
      }),
      this.prisma.follow.count({ where }),
    ]);
    return {
      data: rows.map((row): FollowWithUserInfo => ({
        id: row.id,
        userId: row.userId,
        targetId: row.targetId,
        status: row.status,
        username: row.user.username,
        image: row.user.image ?? undefined,
        postCount: row.user._count.posts,
        readingListCount: row.user._count.readingLists,
        followersCount: row.user._count.followers,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  findByTarget(
    targetId: TargetId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    return this.paginate(
      { targetId: targetId.toString(), status: true },
      pagination,
      sort,
    );
  }

  findAll(
    filter: FollowFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    return this.paginate(
      {
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.targetId ? { targetId: filter.targetId } : {}),
        ...(filter.status === undefined ? {} : { status: filter.status }),
        ...(filter.dateFrom || filter.dateTo
          ? {
              createdAt: {
                ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
                ...(filter.dateTo ? { lte: filter.dateTo } : {}),
              },
            }
          : {}),
      },
      pagination,
      sort,
    );
  }

  async save(follow: FollowEntity): Promise<void> {
    await this.prisma.follow.upsert({
      where: {
        userId_targetId: {
          userId: follow.userId.toString(),
          targetId: follow.targetId.toString(),
        },
      },
      create: {
        id: follow.id.toString(),
        userId: follow.userId.toString(),
        targetId: follow.targetId.toString(),
        status: follow.status.getValue(),
        isDeleted: follow.isDeleted,
        createdAt: follow.createdAt,
        updatedAt: follow.updatedAt,
      },
      update: {
        status: follow.status.getValue(),
        isDeleted: follow.isDeleted,
        updatedAt: follow.updatedAt,
      },
    });
  }

  async exists(
    userId: UserId,
    targetId: TargetId,
  ): Promise<FollowEntity | null> {
    const row = await this.prisma.follow.findUnique({
      where: {
        userId_targetId: {
          userId: userId.toString(),
          targetId: targetId.toString(),
        },
      },
    });
    return row ? FollowMapper.toDomain(row) : null;
  }

  async getFollowStatus(
    userId: UserId,
    targetId: TargetId,
  ): Promise<FollowStatusResult> {
    const [follow, isOwner] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          userId_targetId: {
            userId: userId.toString(),
            targetId: targetId.toString(),
          },
        },
        select: { id: true, status: true, isDeleted: true },
      }),
      Promise.resolve(userId.getValue() === targetId.getValue()),
    ]);
    return {
      userId: userId.toString(),
      targetId: targetId.toString(),
      isFollowing: follow?.status === true && !follow.isDeleted,
      isOwner,
      ...(follow ? { followId: follow.id } : {}),
    };
  }

  countFollowers(targetId: TargetId): Promise<number> {
    return this.prisma.follow.count({
      where: { targetId: targetId.toString(), status: true, isDeleted: false },
    });
  }

  private async paginate(
    filter: {
      userId?: string;
      targetId?: string;
      status?: boolean;
      createdAt?: { gte?: Date; lte?: Date };
    },
    pagination: PaginationOptions = { page: 1, limit: 10 },
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
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
      this.prisma.follow.findMany({
        where: filter,
        orderBy: [orderBy, { id: 'desc' }],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.follow.count({ where: filter }),
    ]);
    return {
      data: rows.map((row) => FollowMapper.toDomain(row)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }
}
