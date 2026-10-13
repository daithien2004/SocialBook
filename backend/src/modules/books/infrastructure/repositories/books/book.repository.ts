import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { ConcurrencyException } from '@/shared/domain/common-exceptions';
import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Book as BookEntity } from '@/modules/books/domain/books/entities/book.entity';
import { BookListReadModel } from '@/modules/books/domain/books/read-models/book-list.read-model';
import {
  BookFilter,
  BookFilters,
  BookSearchCandidate,
  IBookRepository,
} from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/modules/books/domain/books/value-objects/book-title.vo';
import { GenreId } from '@/modules/books/domain/books/value-objects/genre-id.vo';
import { BOOK_WITH_RELATIONS, PrismaBookMapper } from './prisma-book.mapper';

const MAX_PAGE_SIZE = 10_000;

export function buildBookFilter(filter: BookFilter): Prisma.BookWhereInput {
  return {
    isDeleted: false,
    ...(filter.title
      ? { title: { contains: filter.title, mode: 'insensitive' } }
      : {}),
    ...(filter.authorIds?.length
      ? { authorId: { in: filter.authorIds } }
      : filter.authorId
        ? { authorId: filter.authorId }
        : {}),
    ...(filter.genres?.length
      ? { genres: { some: { genreId: { in: filter.genres } } } }
      : {}),
    ...(filter.tags?.length ? { tags: { hasSome: filter.tags } } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.search
      ? {
          OR: [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } },
            { tags: { has: filter.search } },
          ],
        }
      : {}),
    ...(filter.publishedYear ? { publishedYear: filter.publishedYear } : {}),
    ...(filter.ids?.length ? { id: { in: filter.ids } } : {}),
  };
}

export function buildBookSort(
  sort?: SortOptions,
): Prisma.BookOrderByWithRelationInput[] {
  const direction = sort?.order === 'asc' ? 'asc' : 'desc';
  switch (sort?.sortBy) {
    case undefined:
      return [{ createdAt: direction }, { id: direction }];
    case 'title':
      return [{ title: direction }, { id: direction }];
    case 'updatedAt':
      return [{ updatedAt: direction }, { id: direction }];
    case 'views':
      return [{ views: direction }, { id: direction }];
    case 'likes':
      return [{ likes: direction }, { id: direction }];
    case 'publishedYear':
      return [{ publishedYear: direction }, { id: direction }];
    case 'createdAt':
    default:
      return [{ createdAt: direction }, { id: direction }];
  }
}

@Injectable()
export class BookRepository implements IBookRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get client(): Prisma.TransactionClient {
    return this.transactionHost.tx;
  }

  private inTransaction<T>(
    operation: (client: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (this.transactionHost.isTransactionActive()) {
      return operation(this.transactionHost.tx);
    }
    return this.transactionHost.withTransaction(() =>
      operation(this.transactionHost.tx),
    );
  }

  async findUnindexedBooks(limit: number): Promise<BookEntity[]> {
    const rows = await this.client.book.findMany({
      where: {
        status: 'published',
        isDeleted: false,
        vectorIndexedAt: null,
      },
      include: BOOK_WITH_RELATIONS,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return rows.map((row) => PrismaBookMapper.toDomain(row));
  }

  async findById(id: BookId): Promise<BookEntity | null> {
    const row = await this.client.book.findFirst({
      where: { id: id.toString(), isDeleted: false },
      include: BOOK_WITH_RELATIONS,
    });
    return row ? PrismaBookMapper.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<BookEntity | null> {
    const row = await this.client.book.findFirst({
      where: { slug, isDeleted: false },
      include: BOOK_WITH_RELATIONS,
    });
    return row ? PrismaBookMapper.toDomain(row) : null;
  }

  async findByTitle(title: BookTitle): Promise<BookEntity | null> {
    const row = await this.client.book.findFirst({
      where: { title: title.toString(), isDeleted: false },
      include: BOOK_WITH_RELATIONS,
    });
    return row ? PrismaBookMapper.toDomain(row) : null;
  }

  async findAll(
    filter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookEntity>> {
    const where = buildBookFilter(filter);
    const page = Math.max(1, Math.trunc(pagination.page || 1));
    const limit = Math.min(
      Math.max(1, Math.trunc(pagination.limit || 10)),
      MAX_PAGE_SIZE,
    );
    const [rows, total] = await Promise.all([
      this.client.book.findMany({
        where,
        include: BOOK_WITH_RELATIONS,
        orderBy: buildBookSort(sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.client.book.count({ where }),
    ]);
    return {
      data: rows.map((row) => PrismaBookMapper.toDomain(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByGenre(
    genreId: GenreId,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookEntity>> {
    return this.findAll({ genres: [genreId.toString()] }, pagination, sort);
  }

  findPopular(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<BookEntity>> {
    return this.findAll({}, pagination, { sortBy: 'likes', order: 'desc' });
  }

  async save(book: BookEntity): Promise<void> {
    const data = PrismaBookMapper.persistenceData(book);
    const { genres, likesByUser, ...fields } = data;

    if (book.isNew) {
      await this.client.book.create({
        data: { ...fields, genres, likesByUser },
      });
      book.markPersisted(0);
      return;
    }
    if (!book.isDirty) return;

    const nextVersion = book.loadedVersion + 1;
    await this.inTransaction(async (transaction) => {
      const result = await transaction.book.updateMany({
        where: {
          id: book.id.toString(),
          version: book.loadedVersion,
          isDeleted: false,
        },
        data: { ...fields, version: nextVersion },
      });
      if (result.count === 0) {
        throw new ConcurrencyException('Book changed after it was loaded');
      }

      await transaction.bookGenre.deleteMany({
        where: { bookId: book.id.toString() },
      });
      await transaction.bookLike.deleteMany({
        where: { bookId: book.id.toString() },
      });
      if (book.genres.length > 0) {
        await transaction.bookGenre.createMany({
          data: book.genres.map((genreId) => ({
            bookId: book.id.toString(),
            genreId: genreId.toString(),
          })),
        });
      }
      if (book.likedBy.length > 0) {
        await transaction.bookLike.createMany({
          data: book.likedBy.map((userId) => ({
            bookId: book.id.toString(),
            userId,
          })),
        });
      }
    });
    book.markPersisted(nextVersion);
  }

  async delete(id: BookId, expectedVersion: number): Promise<void> {
    const result = await this.client.book.deleteMany({
      where: { id: id.toString(), version: expectedVersion },
    });
    if (result.count === 0) {
      throw new ConcurrencyException('Book changed before it was deleted');
    }
  }

  async softDelete(id: BookId, expectedVersion: number): Promise<void> {
    const result = await this.client.book.updateMany({
      where: {
        id: id.toString(),
        version: expectedVersion,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: expectedVersion + 1,
      },
    });
    if (result.count === 0) {
      throw new ConcurrencyException('Book changed before it was deleted');
    }
  }

  async existsByTitle(title: BookTitle, excludeId?: BookId): Promise<boolean> {
    const row = await this.client.book.findFirst({
      where: {
        title: title.toString(),
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async existsById(id: string): Promise<boolean> {
    const row = await this.client.book.findFirst({
      where: { id, isDeleted: false },
      select: { id: true },
    });
    return row !== null;
  }

  async touchIfActive(id: BookId): Promise<boolean> {
    const result = await this.client.book.updateMany({
      where: { id: id.toString(), isDeleted: false },
      data: { roomReferenceRevision: { increment: 1 } },
    });
    return result.count > 0;
  }

  async incrementViews(id: BookId): Promise<void> {
    await this.client.book.updateMany({
      where: { id: id.toString(), isDeleted: false },
      data: { views: { increment: 1 }, version: { increment: 1 } },
    });
  }

  async addLike(id: BookId, userId: string): Promise<void> {
    await this.inTransaction(async (transaction) => {
      const inserted = await transaction.bookLike.createMany({
        data: [{ bookId: id.toString(), userId }],
        skipDuplicates: true,
      });
      if (inserted.count > 0) {
        await transaction.book.updateMany({
          where: { id: id.toString(), isDeleted: false },
          data: { likes: { increment: 1 }, version: { increment: 1 } },
        });
      }
    });
  }

  async removeLike(id: BookId, userId: string): Promise<void> {
    await this.inTransaction(async (transaction) => {
      const removed = await transaction.bookLike.deleteMany({
        where: { bookId: id.toString(), userId },
      });
      if (removed.count > 0) {
        await transaction.book.updateMany({
          where: { id: id.toString(), likes: { gt: 0 } },
          data: { likes: { decrement: 1 }, version: { increment: 1 } },
        });
      }
    });
  }

  countByGenre(genreId: string): Promise<number> {
    return this.client.book.count({
      where: {
        isDeleted: false,
        genres: { some: { genreId } },
      },
    });
  }

  countTotal(): Promise<number> {
    return this.client.book.count({ where: { isDeleted: false } });
  }

  async countByGenreName(): Promise<
    Array<{ id: string; name: string; slug: string; count: number }>
  > {
    const groups = await this.client.bookGenre.groupBy({
      by: ['genreId'],
      where: { book: { isDeleted: false } },
      _count: { _all: true },
    });
    const genres = await this.client.genre.findMany({
      where: { id: { in: groups.map((group) => group.genreId) } },
      select: { id: true, name: true, slug: true },
    });
    const counts = new Map(
      groups.map((group) => [group.genreId, group._count._all]),
    );
    return genres
      .map((genre) => ({
        ...genre,
        count: counts.get(genre.id) ?? 0,
      }))
      .sort((left, right) => right.count - left.count);
  }

  countByTags(): Promise<Array<{ name: string; count: number }>> {
    return this.client.$queryRaw<Array<{ name: string; count: number }>>(
      Prisma.sql`SELECT tag AS name, COUNT(*)::int AS count
        FROM "books" CROSS JOIN LATERAL unnest("tags") AS tag
        WHERE "isDeleted" = false
        GROUP BY tag ORDER BY count DESC`,
    );
  }

  async findByIds(ids: BookId[]): Promise<BookEntity[]> {
    if (ids.length === 0) return [];
    const rows = await this.client.book.findMany({
      where: { id: { in: ids.map((id) => id.toString()) }, isDeleted: false },
      include: BOOK_WITH_RELATIONS,
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.flatMap((id) => {
      const row = byId.get(id.toString());
      return row ? [PrismaBookMapper.toDomain(row)] : [];
    });
  }

  async findIdsByFilter(filter: BookFilter): Promise<string[]> {
    const rows = await this.client.book.findMany({
      where: buildBookFilter(filter),
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async findSearchCandidates(
    filter: BookFilter,
    limit: number,
  ): Promise<BookSearchCandidate[]> {
    const rows = await this.client.book.findMany({
      where: buildBookFilter(filter),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        author: { select: { name: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      authorName: row.author.name,
    }));
  }

  async getFilters(): Promise<BookFilters> {
    const [genres, tags] = await Promise.all([
      this.client.bookGenre.groupBy({
        by: ['genreId'],
        where: { book: { isDeleted: false, status: 'published' } },
        _count: { _all: true },
        orderBy: { _count: { genreId: 'desc' } },
        take: 20,
      }),
      this.client.$queryRaw<Array<{ name: string; count: number }>>(
        Prisma.sql`SELECT tag AS name, COUNT(*)::int AS count
          FROM "books" CROSS JOIN LATERAL unnest("tags") AS tag
          WHERE "isDeleted" = false AND "status" = 'published'
          GROUP BY tag ORDER BY count DESC LIMIT 20`,
      ),
    ]);
    const genreRows = await this.client.genre.findMany({
      where: { id: { in: genres.map((item) => item.genreId) } },
      select: { id: true, name: true, slug: true },
    });
    const counts = new Map(
      genres.map((item) => [item.genreId, item._count._all]),
    );
    const genreById = new Map(genreRows.map((genre) => [genre.id, genre]));

    return {
      genres: genres.flatMap((item) => {
        const genre = genreById.get(item.genreId);
        return genre ? [{ ...genre, count: counts.get(genre.id) ?? 0 }] : [];
      }),
      tags,
    };
  }

  async findAllList(
    filter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookListReadModel>> {
    const page = Math.max(1, Math.trunc(pagination.page || 1));
    const limit = Math.min(
      Math.max(1, Math.trunc(pagination.limit || 10)),
      MAX_PAGE_SIZE,
    );
    const where = buildBookFilter(filter);
    const [rows, total] = await Promise.all([
      this.client.book.findMany({
        where,
        include: BOOK_WITH_RELATIONS,
        orderBy: buildBookSort(sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.client.book.count({ where }),
    ]);
    return {
      data: rows.map((row) => PrismaBookMapper.toListReadModel(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
