import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { User as UserEntity } from '@/modules/users/domain/users/entities/user.entity';
import {
  IUserRepository,
  UserFilter,
} from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserEmail } from '@/modules/users/domain/users/value-objects/user-email.vo';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';
import { UserMapper } from './user.mapper';

@Injectable()
export class UsersRepository implements IUserRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get client(): Prisma.TransactionClient {
    return this.transactionHost.tx;
  }

  async findById(id: UserId): Promise<UserEntity | null> {
    const row = await this.client.user.findUnique({
      where: { id: id.toString() },
      include: { favoriteGenres: { select: { genreId: true } } },
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: UserEmail): Promise<UserEntity | null> {
    const row = await this.client.user.findUnique({
      where: { email: email.toString() },
      include: { favoriteGenres: { select: { genreId: true } } },
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const row = await this.client.user.findUnique({
      where: { username },
      include: { favoriteGenres: { select: { genreId: true } } },
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findAll(
    filter: UserFilter,
    pagination: PageParams,
  ): Promise<PageResult<UserEntity>> {
    const where: Prisma.UserWhereInput = {};
    if (filter.username) {
      where.username = { contains: filter.username, mode: 'insensitive' };
    }
    if (filter.email) {
      where.email = { contains: filter.email, mode: 'insensitive' };
    }
    if (filter.roleId) where.roleId = filter.roleId;
    if (filter.isBanned !== undefined) where.isBanned = filter.isBanned;
    if (filter.isVerified !== undefined) where.isVerified = filter.isVerified;

    return findPaginated(
      async () => {
        const rows = await this.client.user.findMany({
          where,
          include: { favoriteGenres: { select: { genreId: true } } },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: pagination.offset,
          take: pagination.limit,
        });
        return rows.map((row) => UserMapper.toDomain(row));
      },
      () => this.client.user.count({ where }),
    );
  }

  async save(user: UserEntity): Promise<void> {
    const data = UserMapper.toPersistence(user);
    const { id, roleId, createdAt, ...updateData } = data;
    const favoriteGenres = {
      deleteMany: {},
      create: user.favoriteGenres.map((genreId) => ({ genreId })),
    };

    await this.client.user.upsert({
      where: { id },
      create: {
        ...updateData,
        id,
        createdAt,
        roleId,
        favoriteGenres: {
          create: user.favoriteGenres.map((genreId) => ({ genreId })),
        },
      },
      update: { ...updateData, roleId, favoriteGenres },
    });
  }

  async delete(id: UserId): Promise<void> {
    await this.client.user.deleteMany({ where: { id: id.toString() } });
  }

  async existsByEmail(email: UserEmail, excludeId?: UserId): Promise<boolean> {
    const row = await this.client.user.findFirst({
      where: {
        email: email.toString(),
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async existsByUsername(
    username: string,
    excludeId?: UserId,
  ): Promise<boolean> {
    const row = await this.client.user.findFirst({
      where: {
        username,
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async countByDate(startDate: Date, endDate?: Date): Promise<number> {
    return this.client.user.count({
      where: {
        createdAt: { gte: startDate, ...(endDate ? { lt: endDate } : {}) },
      },
    });
  }

  async countByProvider(): Promise<Map<string, number>> {
    const groups = await this.client.user.groupBy({
      by: ['provider'],
      _count: { _all: true },
    });
    return new Map(groups.map((group) => [group.provider, group._count._all]));
  }

  async getGeographicDistribution(): Promise<
    Array<{ country: string; userCount: number }>
  > {
    const groups = await this.client.user.groupBy({
      by: ['location'],
      where: {
        location: { not: null, notIn: ['', 'null', 'undefined'] },
      },
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

  async getGrowthMetrics(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<Array<{ _id: string; count: number }>> {
    const dateFormat =
      groupBy === 'year'
        ? 'YYYY'
        : groupBy === 'month'
          ? 'YYYY-MM'
          : 'YYYY-MM-DD';
    const rows = await this.client.$queryRaw<
      Array<{ _id: string; count: number }>
    >(Prisma.sql`
      SELECT to_char(date_trunc(${groupBy}, "createdAt"), ${dateFormat}) AS "_id",
             count(*)::int AS "count"
      FROM "users"
      WHERE "createdAt" >= ${startDate}
      GROUP BY 1
      ORDER BY 1 ASC
    `);
    return rows;
  }

  async countAll(): Promise<number> {
    return this.client.user.count();
  }

  async countWithLocation(): Promise<number> {
    return this.client.user.count({
      where: {
        location: { not: null, notIn: ['', 'null', 'undefined'] },
      },
    });
  }

  async findSampleUsersWithLocation(
    limit: number,
  ): Promise<Array<{ username: string; location: string }>> {
    const users = await this.client.user.findMany({
      where: { location: { not: null, notIn: ['', 'null', 'undefined'] } },
      take: limit,
      select: { username: true, location: true },
    });
    return users.flatMap((user) =>
      user.location === null
        ? []
        : [{ username: user.username, location: user.location }],
    );
  }
}
