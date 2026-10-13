import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { BookDetailReadModel } from '@/modules/books/domain/books/read-models/book-detail.read-model';
import { BookListReadModel } from '@/modules/books/domain/books/read-models/book-list.read-model';
import { IBookQueryProvider } from '@/modules/books/domain/books/repositories/book-query.provider.interface';
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

const MAX_PAGE_SIZE = 10_000;

@Injectable()
export class BookQueryProvider implements IBookQueryProvider {
  private readonly logger = new Logger(BookQueryProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorRepository: IVectorRepository,
  ) {}

  async findAllList(
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
    if (filter.genres?.length) {
      const genreRows = await this.prisma.genre.findMany({
        where: {
          OR: [{ id: { in: filter.genres } }, { slug: { in: filter.genres } }],
        },
        select: { id: true, slug: true },
      });
      filter.genres = genreRows.map((genre) => genre.id);
    }

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

    const where = buildBookFilter(filter);
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

  async findDetailBySlug(slug: string): Promise<BookDetailReadModel | null> {
    const row = await this.prisma.book.findFirst({
      where: { slug, isDeleted: false },
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

  async getGrowthMetrics(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<Array<{ _id: string; count: number }>> {
    const format =
      groupBy === 'year'
        ? 'YYYY'
        : groupBy === 'month'
          ? 'YYYY-MM'
          : 'YYYY-MM-DD';
    return this.prisma.$queryRaw<Array<{ _id: string; count: number }>>(
      Prisma.sql`SELECT to_char(date_trunc(${groupBy}, "createdAt"), ${format}) AS "_id",
          count(*)::int AS "count"
        FROM "books"
        WHERE "createdAt" >= ${startDate} AND "isDeleted" = false
        GROUP BY 1 ORDER BY 1 ASC`,
    );
  }
}
