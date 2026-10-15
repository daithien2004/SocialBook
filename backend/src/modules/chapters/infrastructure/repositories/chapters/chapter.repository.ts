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
import { Chapter as ChapterEntity } from '@/modules/chapters/domain/chapters/entities/chapter.entity';
import {
  ChapterFilter,
  IChapterRepository,
} from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/modules/chapters/domain/chapters/value-objects/book-id.vo';
import { ChapterId } from '@/modules/chapters/domain/chapters/value-objects/chapter-id.vo';
import { ChapterTitle } from '@/modules/chapters/domain/chapters/value-objects/chapter-title.vo';
import { ChapterMapper, CHAPTER_WITH_PARAGRAPHS } from './chapter.mapper';

const MAX_PAGE_SIZE = 10_000;

@Injectable()
export class ChapterRepository implements IChapterRepository {
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

  async findById(id: ChapterId): Promise<ChapterEntity | null> {
    const row = await this.client.chapter.findFirst({
      where: { id: id.toString(), isDeleted: false },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    return row ? ChapterMapper.toDomain(row) : null;
  }

  async findByIdAndBookId(
    id: ChapterId,
    bookId: BookId,
  ): Promise<ChapterEntity | null> {
    const row = await this.client.chapter.findFirst({
      where: { id: id.toString(), bookId: bookId.toString(), isDeleted: false },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    return row ? ChapterMapper.toDomain(row) : null;
  }

  async touchIfInBook(id: ChapterId, bookId: BookId): Promise<string | null> {
    return this.inTransaction(async (client) => {
      const updated = await client.chapter.updateMany({
        where: {
          id: id.toString(),
          bookId: bookId.toString(),
          isDeleted: false,
        },
        data: { roomReferenceRevision: { increment: 1 } },
      });
      if (updated.count === 0) return null;

      const chapter = await client.chapter.findUnique({
        where: { id: id.toString() },
        select: { slug: true },
      });
      return chapter?.slug ?? null;
    });
  }

  async findByParagraphId(paragraphId: string): Promise<ChapterEntity | null> {
    const row = await this.client.chapter.findFirst({
      where: {
        isDeleted: false,
        paragraphs: { some: { id: paragraphId } },
      },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    return row ? ChapterMapper.toDomain(row) : null;
  }

  async findBySlug(
    slug: string,
    bookId: BookId,
  ): Promise<ChapterEntity | null> {
    const row = await this.client.chapter.findFirst({
      where: { slug, bookId: bookId.toString(), isDeleted: false },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    return row ? ChapterMapper.toDomain(row) : null;
  }

  private async findAll(
    filter: ChapterFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<ChapterEntity>> {
    const where: Prisma.ChapterWhereInput = {
      isDeleted: false,
      ...(filter.title
        ? { title: { contains: filter.title, mode: 'insensitive' } }
        : {}),
      ...(filter.bookId ? { bookId: filter.bookId } : {}),
      ...(filter.orderIndex === undefined
        ? {}
        : { orderIndex: filter.orderIndex }),
    };
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(Math.max(1, pagination.limit || 10), MAX_PAGE_SIZE);
    const sortField = sort?.sortBy ?? 'orderIndex';
    const direction = sort?.order === 'desc' ? 'desc' : 'asc';

    const [rows, total] = await Promise.all([
      this.client.chapter.findMany({
        where,
        include: CHAPTER_WITH_PARAGRAPHS,
        orderBy: [{ [sortField]: direction }, { id: direction }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.client.chapter.count({ where }),
    ]);

    return {
      data: rows.map((row) => ChapterMapper.toDomain(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  findByBook(
    bookId: BookId,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<ChapterEntity>> {
    return this.findAll({ bookId: bookId.toString() }, pagination, sort);
  }

  async findFirstChapter(bookId: BookId): Promise<ChapterEntity | null> {
    const row = await this.client.chapter.findFirst({
      where: { bookId: bookId.toString(), isDeleted: false },
      include: CHAPTER_WITH_PARAGRAPHS,
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
    });
    return row ? ChapterMapper.toDomain(row) : null;
  }

  async save(chapter: ChapterEntity): Promise<void> {
    const nextVersion = chapter.isNew ? 0 : chapter.loadedVersion + 1;
    const paragraphs = chapter.paragraphs.map((paragraph, orderIndex) => ({
      id: paragraph.id,
      orderIndex,
      content: paragraph.content,
    }));

    if (chapter.isNew) {
      await this.inTransaction((client) =>
        client.chapter.create({
          data: {
            id: chapter.id.toString(),
            bookId: chapter.bookId.toString(),
            title: chapter.title.toString(),
            slug: chapter.slug,
            orderIndex: chapter.orderIndex.getValue(),
            viewsCount: chapter.viewsCount,
            version: 0,
            ttsStatus: chapter.ttsStatus ?? null,
            audioUrl: chapter.audioUrl ?? null,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
            paragraphs: { create: paragraphs },
          },
        }),
      );
      chapter.markPersisted(0);
      return;
    }

    if (!chapter.isDirty) return;

    await this.inTransaction(async (client) => {
      const result = await client.chapter.updateMany({
        where: {
          id: chapter.id.toString(),
          isDeleted: false,
          version: chapter.loadedVersion,
        },
        data: {
          bookId: chapter.bookId.toString(),
          title: chapter.title.toString(),
          slug: chapter.slug,
          orderIndex: chapter.orderIndex.getValue(),
          viewsCount: chapter.viewsCount,
          version: nextVersion,
          ttsStatus: chapter.ttsStatus ?? null,
          audioUrl: chapter.audioUrl ?? null,
          updatedAt: chapter.updatedAt,
        },
      });
      if (result.count === 0) {
        throw new ConcurrencyException('Chapter changed after it was loaded');
      }

      await client.paragraph.deleteMany({
        where: { chapterId: chapter.id.toString() },
      });
      if (paragraphs.length > 0) {
        await client.paragraph.createMany({
          data: paragraphs.map((paragraph) => ({
            ...paragraph,
            chapterId: chapter.id.toString(),
          })),
        });
      }
    });

    chapter.markPersisted(nextVersion);
  }

  async delete(id: ChapterId, expectedVersion: number): Promise<void> {
    const result = await this.client.chapter.updateMany({
      where: {
        id: id.toString(),
        version: expectedVersion,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (result.count === 0) {
      throw new ConcurrencyException('Chapter changed before it was deleted');
    }
  }

  async existsByTitle(
    title: ChapterTitle,
    bookId: BookId,
    excludeId?: ChapterId,
  ): Promise<boolean> {
    const row = await this.client.chapter.findFirst({
      where: {
        title: title.toString(),
        bookId: bookId.toString(),
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async existsByOrderIndex(
    orderIndex: number,
    bookId: BookId,
    excludeId?: ChapterId,
  ): Promise<boolean> {
    const row = await this.client.chapter.findFirst({
      where: {
        orderIndex,
        bookId: bookId.toString(),
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId.toString() } } : {}),
      },
      select: { id: true },
    });
    return row !== null;
  }

  async incrementViewsBySlug(
    bookSlug: string,
    chapterSlug: string,
  ): Promise<void> {
    const book = await this.client.book.findFirst({
      where: { slug: bookSlug, isDeleted: false },
      select: { id: true },
    });
    if (!book) return;

    await this.client.chapter.updateMany({
      where: { bookId: book.id, slug: chapterSlug, isDeleted: false },
      data: { viewsCount: { increment: 1 }, version: { increment: 1 } },
    });
  }

  async countTotal(): Promise<number> {
    return this.client.chapter.count({ where: { isDeleted: false } });
  }

  async getMaxOrderIndex(bookId: BookId): Promise<number> {
    const row = await this.client.chapter.aggregate({
      where: { bookId: bookId.toString(), isDeleted: false },
      _max: { orderIndex: true },
    });
    return row._max.orderIndex ?? 0;
  }

  async updateTtsStatus(
    chapterId: string,
    ttsStatus: 'pending' | 'processing' | 'completed' | 'failed',
    audioUrl?: string,
  ): Promise<void> {
    await this.client.chapter.updateMany({
      where: { id: chapterId, isDeleted: false },
      data: {
        ttsStatus,
        ...(audioUrl === undefined ? {} : { audioUrl }),
        updatedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }
}
