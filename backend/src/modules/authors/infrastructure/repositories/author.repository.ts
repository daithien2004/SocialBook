import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import {
  Author as PrismaAuthor,
  Prisma,
} from '@/core/database/generated/prisma/client';
import {
  PrismaTransactionClient,
  PrismaTransactionalAdapter,
} from '@/core/database/postgres/prisma-transaction.types';
import { Author as AuthorEntity } from '@/modules/authors/domain/entities/author.entity';
import {
  AuthorFilter,
  IAuthorRepository,
} from '@/modules/authors/domain/repositories/author.repository.interface';
import { AuthorId } from '@/modules/authors/domain/value-objects/author-id.vo';
import { AuthorName } from '@/modules/authors/domain/value-objects/author-name.vo';
import { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';

@Injectable()
export class AuthorRepository implements IAuthorRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get prisma(): PrismaTransactionClient {
    return this.transactionHost.tx;
  }

  async findById(id: AuthorId): Promise<AuthorEntity | null> {
    const row = await this.prisma.author.findUnique({
      where: { id: id.toString() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByName(name: AuthorName): Promise<AuthorEntity | null> {
    const row = await this.prisma.author.findUnique({
      where: { name: name.toString() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(
    filter: AuthorFilter,
    pagination: PageParams,
  ): Promise<PageResult<AuthorEntity>> {
    const where: Prisma.AuthorWhereInput = {
      ...(filter.name
        ? { name: { contains: filter.name, mode: 'insensitive' } }
        : {}),
      ...(filter.bio
        ? { bio: { contains: filter.bio, mode: 'insensitive' } }
        : {}),
      ...(filter.createdAfter || filter.createdBefore
        ? {
            createdAt: {
              ...(filter.createdAfter ? { gte: filter.createdAfter } : {}),
              ...(filter.createdBefore ? { lte: filter.createdBefore } : {}),
            },
          }
        : {}),
    };

    return findPaginated(
      async () => {
        const rows = await this.prisma.author.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: pagination.offset,
          take: pagination.limit,
        });
        return rows.map((row) => this.toDomain(row));
      },
      () => this.prisma.author.count({ where }),
    );
  }

  async save(author: AuthorEntity): Promise<void> {
    const data = {
      name: author.name.toString(),
      slug: author.slug,
      bio: author.bio,
      photoUrl: author.photoUrl,
      createdAt: author.createdAt,
      updatedAt: author.updatedAt,
    };

    await this.prisma.author.upsert({
      where: { id: author.id.toString() },
      create: { id: author.id.toString(), ...data },
      update: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
        photoUrl: data.photoUrl,
        updatedAt: data.updatedAt,
      },
    });
  }

  async delete(id: AuthorId): Promise<void> {
    await this.prisma.author.deleteMany({ where: { id: id.toString() } });
  }

  async existsByName(name: AuthorName, excludeId?: AuthorId): Promise<boolean> {
    const row = await this.prisma.author.findFirst({
      where: {
        name: name.toString(),
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async searchByName(query: string, limit = 10): Promise<AuthorEntity[]> {
    if (!query) return [];

    const rows = await this.prisma.author.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: PrismaAuthor): AuthorEntity {
    return AuthorEntity.reconstitute({
      id: row.id,
      name: row.name,
      slug: row.slug,
      bio: row.bio,
      photoUrl: row.photoUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
