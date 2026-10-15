import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';
import {
  UsersReadRepository,
  type AdminUserFilter,
} from '@/modules/users/application/ports/users-read.repository';
import type { AdminUserReadModel } from '../../../application/read-models/admin-user.read-model';
import type { PublicUserReadModel } from '../../../application/read-models/public-user.read-model';
import type { ReadingPreferencesReadModel } from '../../../application/read-models/reading-preferences.read-model';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUsersReadRepository extends UsersReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  private get client(): Prisma.TransactionClient {
    return this.transactionHost.tx;
  }

  async findAdminUsers(
    ability: AppAbility,
    filter: AdminUserFilter,
    page: PageParams,
  ): Promise<PageResult<AdminUserReadModel>> {
    const where: Prisma.UserWhereInput = {
      AND: [
        accessibleBy(ability).ofType('User'),
        {
          ...(filter.username
            ? { username: { contains: filter.username, mode: 'insensitive' } }
            : {}),
          ...(filter.email
            ? { email: { contains: filter.email, mode: 'insensitive' } }
            : {}),
          ...(filter.roleId ? { roleId: filter.roleId } : {}),
          ...(filter.isBanned === undefined
            ? {}
            : { isBanned: filter.isBanned }),
          ...(filter.isVerified === undefined
            ? {}
            : { isVerified: filter.isVerified }),
        },
      ],
    };

    return findPaginated(
      async () => {
        const rows = await this.client.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            email: true,
            roleId: true,
            isVerified: true,
            isBanned: true,
            provider: true,
            image: true,
            bio: true,
            location: true,
            website: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: page.offset,
          take: page.limit,
        });
        return rows.map((row) => ({
          id: row.id,
          username: row.username,
          email: row.email,
          roleId: row.roleId,
          isVerified: row.isVerified,
          isBanned: row.isBanned,
          provider: row.provider,
          image: row.image ?? undefined,
          bio: row.bio ?? undefined,
          location: row.location ?? undefined,
          website: row.website ?? undefined,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      },
      () => this.client.user.count({ where }),
    );
  }

  async findPublicUsers(
    username: string | undefined,
    page: PageParams,
  ): Promise<PageResult<PublicUserReadModel>> {
    const where: Prisma.UserWhereInput = username
      ? { username: { contains: username, mode: 'insensitive' } }
      : {};

    return findPaginated(
      async () => {
        const rows = await this.client.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            image: true,
            bio: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: page.offset,
          take: page.limit,
        });
        return rows.map((row) => ({
          id: row.id,
          username: row.username,
          image: row.image ?? undefined,
          bio: row.bio ?? undefined,
          createdAt: row.createdAt,
        }));
      },
      () => this.client.user.count({ where }),
    );
  }

  async findReadingPreferences(
    ability: AppAbility,
    userId: string,
  ): Promise<ReadingPreferencesReadModel | null> {
    const row = await this.client.user.findFirst({
      where: {
        AND: [{ id: userId }, accessibleBy(ability).ofType('User')],
      },
      select: { readingPreferences: true },
    });
    if (!row) return null;
    return UserMapper.toReadingPreferencesReadModel(row.readingPreferences);
  }
}
