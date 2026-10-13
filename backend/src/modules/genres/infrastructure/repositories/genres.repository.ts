import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import {
  PrismaTransactionClient,
  PrismaTransactionalAdapter,
} from '@/core/database/postgres/prisma-transaction.types';
import { Genre as GenreEntity } from '@/modules/genres/domain/entities/genre.entity';
import {
  GenreFilter,
  IGenreRepository,
} from '@/modules/genres/domain/repositories/genre.repository.interface';
import { GenreId } from '@/modules/genres/domain/value-objects/genre-id.vo';
import { GenreName } from '@/modules/genres/domain/value-objects/genre-name.vo';
import {
  PaginatedResult,
  PaginationOptions,
  buildPaginationMeta,
} from '@/shared/domain/pagination.types';
import { GenreMapper } from './genre.mapper';

@Injectable()
export class GenresRepository implements IGenreRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get prisma(): PrismaTransactionClient {
    return this.transactionHost.tx;
  }

  async findById(id: GenreId): Promise<GenreEntity | null> {
    const row = await this.prisma.genre.findUnique({
      where: { id: id.toString() },
    });
    return row ? GenreMapper.toDomain(row) : null;
  }

  async findByName(name: GenreName): Promise<GenreEntity | null> {
    const row = await this.prisma.genre.findUnique({
      where: { name: name.toString() },
    });
    return row ? GenreMapper.toDomain(row) : null;
  }

  async findBySlugs(slugs: string[]): Promise<GenreEntity[]> {
    const rows = await this.prisma.genre.findMany({
      where: { slug: { in: slugs } },
    });
    return rows.map((row) => GenreMapper.toDomain(row));
  }

  async findAll(
    filter: GenreFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<GenreEntity>> {
    const where: Prisma.GenreWhereInput = filter.name
      ? { name: { contains: filter.name, mode: 'insensitive' } }
      : {};
    const offset = (pagination.page - 1) * pagination.limit;

    const [rows, total] = await Promise.all([
      this.prisma.genre.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: pagination.limit,
      }),
      this.prisma.genre.count({ where }),
    ]);

    return {
      data: rows.map((row) => GenreMapper.toDomain(row)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findAllSimple(): Promise<GenreEntity[]> {
    const rows = await this.prisma.genre.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => GenreMapper.toDomain(row));
  }

  async findByNames(names: string[]): Promise<GenreEntity[]> {
    if (names.length === 0) return [];

    const rows = await this.prisma.genre.findMany({
      where: {
        OR: names.map((name) => ({
          name: { equals: name, mode: 'insensitive' },
        })),
      },
    });
    return rows.map((row) => GenreMapper.toDomain(row));
  }

  async existsByName(name: GenreName, excludeId?: GenreId): Promise<boolean> {
    const row = await this.prisma.genre.findFirst({
      where: {
        name: name.toString(),
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async save(genre: GenreEntity): Promise<void> {
    const data = GenreMapper.toPersistence(genre);
    const { id, createdAt: _createdAt, ...updateData } = data;

    await this.prisma.genre.upsert({
      where: { id },
      create: data,
      update: updateData,
    });
  }

  async delete(id: GenreId): Promise<void> {
    await this.prisma.genre.deleteMany({ where: { id: id.toString() } });
  }
}
