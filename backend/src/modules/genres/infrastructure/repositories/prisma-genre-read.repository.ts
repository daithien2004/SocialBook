import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';
import { GenreReadRepository } from '../../application/ports/genre-read.repository';
import type { GenreReadModel } from '../../application/read-models/genre.read-model';

@Injectable()
export class PrismaGenreReadRepository extends GenreReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async findById(
    ability: AppAbility,
    id: string,
  ): Promise<GenreReadModel | null> {
    const row = await this.transactionHost.tx.genre.findFirst({
      where: {
        AND: [{ id }, accessibleBy(ability).ofType('Genre')],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return row;
  }

  findByName(
    ability: AppAbility,
    name: string,
  ): Promise<GenreReadModel | null> {
    return this.transactionHost.tx.genre.findFirst({
      where: {
        AND: [
          { name: { equals: name, mode: 'insensitive' } },
          accessibleBy(ability).ofType('Genre'),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findPage(
    ability: AppAbility,
    filter: { name?: string },
    pagination: PageParams,
  ): Promise<PageResult<GenreReadModel>> {
    const userFilter: Prisma.GenreWhereInput = filter.name
      ? { name: { contains: filter.name, mode: 'insensitive' } }
      : {};
    const where: Prisma.GenreWhereInput = {
      AND: [accessibleBy(ability).ofType('Genre'), userFilter],
    };

    return findPaginated(
      () =>
        this.transactionHost.tx.genre.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip: pagination.offset,
          take: pagination.limit,
        }),
      () => this.transactionHost.tx.genre.count({ where }),
    );
  }

  findBySlugs(slugs: string[]): Promise<GenreReadModel[]> {
    if (slugs.length === 0) return Promise.resolve([]);

    return this.transactionHost.tx.genre.findMany({
      where: { slug: { in: slugs } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByNames(names: string[]): Promise<GenreReadModel[]> {
    if (names.length === 0) return Promise.resolve([]);

    return this.transactionHost.tx.genre.findMany({
      where: {
        OR: names.map((name) => ({
          name: { equals: name, mode: 'insensitive' },
        })),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findAllSimple(): Promise<GenreReadModel[]> {
    return this.transactionHost.tx.genre.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  countActiveBooksByGenre(id: string): Promise<number> {
    // This is a read-only check against Books required by the existing delete rule.
    return this.transactionHost.tx.book.count({
      where: {
        isDeleted: false,
        genres: { some: { genreId: id } },
      },
    });
  }
}
