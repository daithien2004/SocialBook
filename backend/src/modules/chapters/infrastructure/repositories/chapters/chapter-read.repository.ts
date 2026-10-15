import { Injectable, BadRequestException } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  BOOK_WITH_RELATIONS,
  PrismaBookMapper,
} from '@/modules/books/infrastructure/public-api';
import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { ChapterDetailReadModel } from '@/modules/chapters/application/read-models/chapter-detail.read-model';
import { ChapterListReadModel } from '@/modules/chapters/application/read-models/chapter-list.read-model';
import {
  ChapterFilter,
  ChapterSortField,
} from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import {
  Chapter as PrismaChapter,
  Prisma as PrismaTypes,
} from '@/core/database/generated/prisma/client';
import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
  buildPaginationMeta,
} from '@/shared/domain/pagination.types';
import { CHAPTER_WITH_PARAGRAPHS } from './chapter.mapper';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { ChapterAudioSourceReadModel } from '@/modules/chapters/application/read-models/chapter-audio-source.read-model';

interface ChapterPageRow extends PrismaChapter {
  paragraphs: Array<{ id: string; content: string; orderIndex: number }>;
}

const SORTABLE_FIELDS: ReadonlySet<string> = new Set<ChapterSortField>([
  'createdAt',
  'updatedAt',
  'title',
  'orderIndex',
  'viewsCount',
]);

function isChapterSortField(value: string): value is ChapterSortField {
  return SORTABLE_FIELDS.has(value);
}

@Injectable()
export class ChapterReadRepository implements IChapterReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findAudioSourceById(
    chapterId: string,
  ): Promise<ChapterAudioSourceReadModel | null> {
    const row = await this.transactionHost.tx.chapter.findFirst({
      where: { id: chapterId, isDeleted: false },
      select: {
        id: true,
        bookId: true,
        paragraphs: {
          select: { content: true },
          orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
        },
      },
    });
    return row;
  }

  async findAudioSourcesByBookId(
    bookId: string,
    limit: number,
  ): Promise<ChapterAudioSourceReadModel[]> {
    const rows = await this.transactionHost.tx.chapter.findMany({
      where: { bookId, isDeleted: false },
      select: {
        id: true,
        bookId: true,
        paragraphs: {
          select: { content: true },
          orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    return rows;
  }

  async findSlugsByIds(chapterIds: string[]): Promise<Map<string, string>> {
    if (chapterIds.length === 0) return new Map();
    const rows = await this.transactionHost.tx.chapter.findMany({
      where: { id: { in: chapterIds }, isDeleted: false },
      select: { id: true, slug: true },
    });
    return new Map(rows.map((row) => [row.id, row.slug]));
  }

  async findDetailBySlug(
    ability: AppAbility,
    chapterSlug: string,
    bookSlug: string,
  ): Promise<ChapterDetailReadModel | null> {
    const book = await this.transactionHost.tx.book.findFirst({
      where: {
        AND: [
          { slug: bookSlug, isDeleted: false },
          accessibleBy(ability).ofType('Book'),
        ],
      },
      include: BOOK_WITH_RELATIONS,
    });
    if (!book) return null;

    const chapter = await this.transactionHost.tx.chapter.findFirst({
      where: {
        AND: [
          { slug: chapterSlug, bookId: book.id, isDeleted: false },
          accessibleBy(ability).ofType('Chapter'),
        ],
      },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    if (!chapter) return null;

    const navigation = await this.findNavigation(book.id, chapter.orderIndex);
    return this.toDetail(book, chapter, navigation.previous, navigation.next);
  }

  async findById(
    ability: AppAbility,
    chapterId: string,
  ): Promise<ChapterReadModel | null> {
    const row = await this.transactionHost.tx.chapter.findFirst({
      where: {
        AND: [
          { id: chapterId, isDeleted: false },
          accessibleBy(ability).ofType('Chapter'),
        ],
      },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    return row ? this.toChapterReadModel(row) : null;
  }

  async isAccessibleBySlug(
    ability: AppAbility,
    chapterSlug: string,
    bookSlug: string,
  ): Promise<boolean> {
    const chapter = await this.transactionHost.tx.chapter.findFirst({
      where: {
        AND: [
          { slug: chapterSlug, isDeleted: false },
          accessibleBy(ability).ofType('Chapter'),
          {
            book: {
              is: {
                AND: [
                  { slug: bookSlug, isDeleted: false },
                  accessibleBy(ability).ofType('Book'),
                ],
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    return chapter !== null;
  }

  async findCurrentRoomChapterById(
    bookId: string,
    chapterId: string,
  ): Promise<ChapterDetailReadModel | null> {
    const [book, chapter] = await Promise.all([
      this.transactionHost.tx.book.findUnique({
        where: { id: bookId },
        include: BOOK_WITH_RELATIONS,
      }),
      this.transactionHost.tx.chapter.findFirst({
        where: { id: chapterId, bookId },
        include: CHAPTER_WITH_PARAGRAPHS,
      }),
    ]);
    if (!book || !chapter) return null;

    const navigation = await this.findNavigation(book.id, chapter.orderIndex);
    return this.toDetail(book, chapter, navigation.previous, navigation.next);
  }

  async findDetailByBookIdAndSlug(
    bookId: string,
    chapterSlug: string,
  ): Promise<ChapterDetailReadModel | null> {
    const book = await this.transactionHost.tx.book.findFirst({
      where: { id: bookId, isDeleted: false },
      include: BOOK_WITH_RELATIONS,
    });
    if (!book) return null;

    const chapter = await this.transactionHost.tx.chapter.findFirst({
      where: { bookId, slug: chapterSlug, isDeleted: false },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    if (!chapter) return null;

    const navigation = await this.findNavigation(book.id, chapter.orderIndex);
    return this.toDetail(book, chapter, navigation.previous, navigation.next);
  }

  async findPaginated(
    ability: AppAbility,
    chapterFilter: ChapterFilter,
    pagination: PaginationOptions,
    sort?: SortOptions<ChapterSortField>,
  ): Promise<PaginatedResult<ChapterReadModel>> {
    const where: PrismaTypes.ChapterWhereInput = {
      AND: [
        accessibleBy(ability).ofType('Chapter'),
        {
          isDeleted: false,
          ...(chapterFilter.title
            ? { title: { contains: chapterFilter.title, mode: 'insensitive' } }
            : {}),
          ...(chapterFilter.bookId ? { bookId: chapterFilter.bookId } : {}),
          ...(chapterFilter.orderIndex === undefined
            ? {}
            : { orderIndex: chapterFilter.orderIndex }),
        },
      ],
    };
    const page = this.positiveInteger(pagination.page, 1);
    const limit = Math.min(this.positiveInteger(pagination.limit, 10), 100);
    const { sortField, direction } = this.resolveSort(sort);
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.chapter.findMany({
        where,
        include: CHAPTER_WITH_PARAGRAPHS,
        orderBy: [{ [sortField]: direction }, { id: direction }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.transactionHost.tx.chapter.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toChapterReadModel(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findListByBookSlug(
    ability: AppAbility,
    bookSlug: string,
    pagination: PaginationOptions,
  ): Promise<ChapterListReadModel | null> {
    const book = await this.transactionHost.tx.book.findFirst({
      where: {
        AND: [
          { slug: bookSlug, isDeleted: false },
          accessibleBy(ability).ofType('Book'),
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        authorId: true,
      },
    });
    if (!book) return null;
    const page = this.positiveInteger(pagination.page, 1);
    const limit = Math.min(this.positiveInteger(pagination.limit, 10), 100);
    const where: PrismaTypes.ChapterWhereInput = {
      bookId: book.id,
      isDeleted: false,
    };
    const [chapters, total] = await Promise.all([
      this.transactionHost.tx.chapter.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          orderIndex: true,
          viewsCount: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { paragraphs: true } },
        },
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.transactionHost.tx.chapter.count({ where }),
    ]);

    const ttsRows = chapters.length
      ? await this.transactionHost.tx.textToSpeech.findMany({
          where: {
            chapterId: { in: chapters.map((chapter) => chapter.id) },
            status: 'completed',
          },
          select: { chapterId: true, audioUrl: true },
          orderBy: [
            { chapterId: 'asc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
        })
      : [];
    const audioByChapter = new Map<string, string | null>();
    for (const tts of ttsRows) {
      if (!audioByChapter.has(tts.chapterId)) {
        audioByChapter.set(tts.chapterId, tts.audioUrl);
      }
    }

    return {
      book: {
        id: book.id,
        title: book.title,
        slug: book.slug,
        coverUrl: book.coverUrl,
        authorId: book.authorId,
      },
      chapters: chapters.map((chapter) => {
        const audioUrl = audioByChapter.get(chapter.id);
        return {
          id: chapter.id,
          title: chapter.title,
          slug: chapter.slug,
          orderIndex: chapter.orderIndex,
          viewsCount: chapter.viewsCount,
          paragraphsCount: chapter._count.paragraphs,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt,
          ttsStatus: audioUrl ? 'completed' : undefined,
          audioUrl,
        };
      }),
      total,
    };
  }

  countByBook(bookId: string): Promise<number> {
    return this.transactionHost.tx.chapter.count({
      where: { bookId, isDeleted: false },
    });
  }

  async countChaptersForBooks(bookIds: string[]): Promise<Map<string, number>> {
    if (bookIds.length === 0) return new Map();

    const rows = await this.transactionHost.tx.chapter.groupBy({
      by: ['bookId'],
      where: { bookId: { in: bookIds }, isDeleted: false },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.bookId, row._count._all]));
  }

  private async findNavigation(bookId: string, orderIndex: number) {
    const [previous, next] = await Promise.all([
      this.transactionHost.tx.chapter.findFirst({
        where: { bookId, isDeleted: false, orderIndex: { lt: orderIndex } },
        select: { id: true, title: true, slug: true, orderIndex: true },
        orderBy: [{ orderIndex: 'desc' }, { id: 'desc' }],
      }),
      this.transactionHost.tx.chapter.findFirst({
        where: { bookId, isDeleted: false, orderIndex: { gt: orderIndex } },
        select: { id: true, title: true, slug: true, orderIndex: true },
        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return { previous, next };
  }

  private toDetail(
    book: PrismaTypes.BookGetPayload<{ include: typeof BOOK_WITH_RELATIONS }>,
    chapter: PrismaTypes.ChapterGetPayload<{
      include: typeof CHAPTER_WITH_PARAGRAPHS;
    }>,
    previous: {
      id: string;
      title: string;
      slug: string;
      orderIndex: number;
    } | null,
    next: {
      id: string;
      title: string;
      slug: string;
      orderIndex: number;
    } | null,
  ): ChapterDetailReadModel {
    return {
      book: PrismaBookMapper.toListReadModel(book),
      chapter: {
        id: chapter.id,
        bookId: chapter.bookId,
        title: chapter.title,
        slug: chapter.slug,
        orderIndex: chapter.orderIndex,
        viewsCount: chapter.viewsCount,
        paragraphs: chapter.paragraphs.map(({ id, content }) => ({
          id,
          content,
        })),
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      },
      navigation: {
        previous: previous ? { ...previous } : null,
        next: next ? { ...next } : null,
      },
    };
  }

  private positiveInteger(value: number, fallback: number): number {
    const normalized = Math.trunc(value);
    return Number.isFinite(normalized) && normalized > 0
      ? normalized
      : fallback;
  }

  private resolveSort(sort?: SortOptions): {
    sortField: ChapterSortField;
    direction: 'asc' | 'desc';
  } {
    const sortField = sort?.sortBy ?? 'orderIndex';
    if (!isChapterSortField(sortField)) {
      throw new BadRequestException(
        `Unsupported chapter sort field: ${sortField}`,
      );
    }
    return {
      sortField,
      direction: sort?.sortBy && sort.order === 'desc' ? 'desc' : 'asc',
    };
  }

  private toChapterReadModel(row: ChapterPageRow): ChapterReadModel {
    const paragraphs = row.paragraphs.map(({ id, content }) => ({
      id,
      content,
    }));
    const firstParagraph = paragraphs[0]?.content ?? '';
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      bookId: row.bookId,
      paragraphs,
      viewsCount: row.viewsCount,
      orderIndex: row.orderIndex,
      characterCount: paragraphs.reduce(
        (count, paragraph) => count + paragraph.content.length,
        0,
      ),
      contentPreview:
        firstParagraph.length <= 200
          ? firstParagraph
          : `${firstParagraph.substring(0, 200)}...`,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
