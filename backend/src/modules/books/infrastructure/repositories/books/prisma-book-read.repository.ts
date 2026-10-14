import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { BookDetailReadModel } from '@/modules/books/application/read-models/book-detail.read-model';
import { BookListReadModel } from '@/modules/books/application/read-models/book-list.read-model';
import { BookFiltersReadModel } from '@/modules/books/application/read-models/book-filters.read-model';
import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import { BookFilter } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { IVectorRepository } from '@/modules/chroma/domain/public-api';
import { SearchQuery } from '@/modules/chroma/domain/public-api';
import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
  buildPaginationMeta,
} from '@/shared/domain/pagination.types';
import { BOOK_WITH_RELATIONS, PrismaBookMapper } from './prisma-book.mapper';
import { buildBookFilter, buildBookSort } from './book.repository';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class PrismaBookReadRepository implements BookReadRepository {
  private readonly logger = new Logger(PrismaBookReadRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorRepository: IVectorRepository,
  ) {}

  async findAllList(
    ability: AppAbility,
    inputFilter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookListReadModel>> {
    const page = Math.max(1, Math.trunc(pagination.page || 1));
    const limit = Math.min(
      Math.max(1, Math.trunc(pagination.limit || 10)),
      MAX_PAGE_SIZE,
    );
    const filter = { ...inputFilter };
    let orderedIds: string[] | undefined;
    if (filter.search?.trim()) {
      try {
        const query = SearchQuery.create({
          id: randomUUID(),
          query: filter.search,
          embedding: [],
          contentType: 'book',
          limit: limit * 2,
          threshold: 0.1,
        });
        const vectorResults = await this.vectorRepository.search(query);
        if (vectorResults.length > 0) {
          orderedIds = vectorResults.map((item) => item.document.contentId);
          delete filter.search;
          filter.ids = orderedIds;
        }
      } catch (error: unknown) {
        this.logger.error(
          'Vector search integration failed; using PostgreSQL search.',
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    const where = {
      AND: [accessibleBy(ability).ofType('Book'), buildBookFilter(filter)],
    };
    const [rows, total] = orderedIds
      ? await Promise.all([
          this.prisma.book.findMany({
            where,
            include: BOOK_WITH_RELATIONS,
          }),
          this.prisma.book.count({ where }),
        ])
      : await Promise.all([
          this.prisma.book.findMany({
            where,
            include: BOOK_WITH_RELATIONS,
            orderBy: buildBookSort(sort),
            skip: (page - 1) * limit,
            take: limit,
          }),
          this.prisma.book.count({ where }),
        ]);
    if (orderedIds) {
      const rank = new Map(orderedIds.map((id, index) => [id, index]));
      rows.sort(
        (left, right) =>
          (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER),
      );
      rows.splice(0, (page - 1) * limit);
      rows.splice(limit);
    }

    return {
      data: rows.map((row) => PrismaBookMapper.toListReadModel(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findListById(
    ability: AppAbility,
    id: string,
  ): Promise<BookListReadModel | null> {
    const row = await this.prisma.book.findFirst({
      where: {
        AND: [{ id, isDeleted: false }, accessibleBy(ability).ofType('Book')],
      },
      include: BOOK_WITH_RELATIONS,
    });
    return row ? PrismaBookMapper.toListReadModel(row) : null;
  }

  async findDetailBySlug(
    ability: AppAbility,
    slug: string,
  ): Promise<BookDetailReadModel | null> {
    const row = await this.prisma.book.findFirst({
      where: {
        AND: [{ slug, isDeleted: false }, accessibleBy(ability).ofType('Book')],
      },
      include: {
        ...BOOK_WITH_RELATIONS,
        chapters: {
          where: { isDeleted: false },
          orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            orderIndex: true,
            viewsCount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return row ? PrismaBookMapper.toDetailReadModel(row) : null;
  }

  async getFilters(ability: AppAbility): Promise<BookFiltersReadModel> {
    const [genreGroups, tags] = await Promise.all([
      this.prisma.bookGenre.groupBy({
        by: ['genreId'],
        where: {
          book: {
            AND: [
              { isDeleted: false, status: 'published' },
              accessibleBy(ability).ofType('Book'),
            ],
          },
        },
        _count: { _all: true },
        orderBy: { _count: { genreId: 'desc' } },
        take: 20,
      }),
      this.prisma.$queryRaw<Array<{ name: string; count: number }>>(
        Prisma.sql`SELECT tag AS name, COUNT(*)::int AS count
          FROM "books" CROSS JOIN LATERAL unnest("tags") AS tag
          WHERE "isDeleted" = false AND "status" = 'published'
          GROUP BY tag ORDER BY count DESC LIMIT 20`,
      ),
    ]);

    // This is a read-only lookup of the names/slugs for IDs counted from the Books relation.
    const genreRows = await this.prisma.genre.findMany({
      where: { id: { in: genreGroups.map((group) => group.genreId) } },
      select: { id: true, name: true, slug: true },
    });
    const genreById = new Map(genreRows.map((genre) => [genre.id, genre]));
    const countById = new Map(
      genreGroups.map((group) => [group.genreId, group._count._all]),
    );

    return {
      genres: genreGroups.flatMap((group) => {
        const genre = genreById.get(group.genreId);
        return genre ? [{ ...genre, count: countById.get(genre.id) ?? 0 }] : [];
      }),
      tags,
    };
  }
}
