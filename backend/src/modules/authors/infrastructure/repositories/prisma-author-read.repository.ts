import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';
import { AuthorReadRepository } from '../../application/ports/author-read.repository';
import { AuthorIndexReadRepository } from '../../application/ports/author-index-read.repository';
import type { AuthorReadModel } from '../../application/read-models/author.read-model';
import type { AuthorSearchReadModel } from '../../application/read-models/author-search.read-model';

@Injectable()
export class PrismaAuthorReadRepository
  extends AuthorReadRepository
  implements AuthorIndexReadRepository
{
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  findById(ability: AppAbility, id: string): Promise<AuthorReadModel | null> {
    return this.transactionHost.tx.author.findFirst({
      where: { AND: [{ id }, accessibleBy(ability).ofType('Author')] },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByName(
    ability: AppAbility,
    name: string,
  ): Promise<AuthorReadModel | null> {
    return this.transactionHost.tx.author.findFirst({
      where: {
        AND: [
          { name: { equals: name, mode: 'insensitive' } },
          accessibleBy(ability).ofType('Author'),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findPage(
    ability: AppAbility,
    filter: { name?: string; bio?: string },
    pagination: PageParams,
  ): Promise<PageResult<AuthorReadModel>> {
    const userFilter: Prisma.AuthorWhereInput = {
      ...(filter.name
        ? { name: { contains: filter.name, mode: 'insensitive' } }
        : {}),
      ...(filter.bio
        ? { bio: { contains: filter.bio, mode: 'insensitive' } }
        : {}),
    };
    const where: Prisma.AuthorWhereInput = {
      AND: [accessibleBy(ability).ofType('Author'), userFilter],
    };

    return findPaginated(
      () =>
        this.transactionHost.tx.author.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            bio: true,
            photoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: pagination.offset,
          take: pagination.limit,
        }),
      () => this.transactionHost.tx.author.count({ where }),
    );
  }

  searchByName(name: string, limit: number): Promise<AuthorSearchReadModel[]> {
    return this.transactionHost.tx.author.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
      select: { id: true, name: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  findIndexPage(pagination: PageParams): Promise<PageResult<AuthorReadModel>> {
    const where: Prisma.AuthorWhereInput = {};
    return findPaginated(
      () =>
        this.transactionHost.tx.author.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            bio: true,
            photoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: pagination.offset,
          take: Math.min(pagination.limit, 100),
        }),
      () => this.transactionHost.tx.author.count({ where }),
    );
  }
}
