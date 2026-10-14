import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import {
  BOOK_WITH_RELATIONS,
  PrismaBookMapper,
} from '@/modules/books/infrastructure/public-api';
import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { ChapterDetailReadModel } from '@/modules/chapters/application/read-models/chapter-detail.read-model';
import { ChapterListReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-list.read-model';
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
  constructor(private readonly prisma: PrismaService) {}

  async findSlugsByIds(chapterIds: string[]): Promise<Map<string, string>> {
    if (chapterIds.length === 0) return new Map();
    const rows = await this.prisma.chapter.findMany({
      where: { id: { in: chapterIds }, isDeleted: false },
      select: { id: true, slug: true },
    });
    return new Map(rows.map((row) => [row.id, row.slug]));
  }

  async findDetailBySlug(
    chapterSlug: string,
    bookSlug: string,
  ): Promise<ChapterDetailReadModel | null> {
    const book = await this.prisma.book.findFirst({
      where: { slug: bookSlug, isDeleted: false },
      include: BOOK_WITH_RELATIONS,
    });
    if (!book) return null;

    const chapter = await this.prisma.chapter.findFirst({
      where: { slug: chapterSlug, bookId: book.id, isDeleted: false },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    if (!chapter) return null;

    const navigation = await this.findNavigation(book.id, chapter.orderIndex);
    return this.toDetail(book, chapter, navigation.previous, navigation.next);
  }

  async findCurrentRoomChapterById(
    bookId: string,
    chapterId: string,
  ): Promise<ChapterDetailReadModel | null> {
    const [book, chapter] = await Promise.all([
      this.prisma.book.findUnique({
        where: { id: bookId },
        include: BOOK_WITH_RELATIONS,
      }),
      this.prisma.chapter.findFirst({
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
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, isDeleted: false },
      include: BOOK_WITH_RELATIONS,
    });
    if (!book) return null;

    const chapter = await this.prisma.chapter.findFirst({
      where: { bookId, slug: chapterSlug, isDeleted: false },
      include: CHAPTER_WITH_PARAGRAPHS,
    });
    if (!chapter) return null;

    const navigation = await this.findNavigation(book.id, chapter.orderIndex);
    return this.toDetail(book, chapter, navigation.previous, navigation.next);
  }

  async findPaginated(
    chapterFilter: ChapterFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<ChapterResult>> {
    const where: PrismaTypes.ChapterWhereInput = {
      isDeleted: false,
      ...(chapterFilter.title
        ? { title: { contains: chapterFilter.title, mode: 'insensitive' } }
        : {}),
      ...(chapterFilter.bookId ? { bookId: chapterFilter.bookId } : {}),
      ...(chapterFilter.orderIndex === undefined
        ? {}
        : { orderIndex: chapterFilter.orderIndex }),
    };
    const page = this.positiveInteger(pagination.page, 1);
    const limit = Math.min(this.positiveInteger(pagination.limit, 10), 1000);
    const { sortField, direction } = this.resolveSort(sort);
    const [rows, total] = await Promise.all([
      this.prisma.chapter.findMany({
        where,
        include: CHAPTER_WITH_PARAGRAPHS,
        orderBy: [{ [sortField]: direction }, { id: direction }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chapter.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toChapterResult(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findListByBookSlug(
    bookSlug: string,
    pagination: PaginationOptions,
  ): Promise<ChapterListReadModel> {
    const book = await this.prisma.book.findFirst({
      where: { slug: bookSlug, isDeleted: false },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        authorId: true,
      },
    });
    if (!book) throw new NotFoundException('Book not found');

    const page = this.positiveInteger(pagination.page, 1);
    const limit = Math.min(this.positiveInteger(pagination.limit, 10), 1000);
    const where: PrismaTypes.ChapterWhereInput = {
      bookId: book.id,
      isDeleted: false,
    };
    const [chapters, total] = await Promise.all([
      this.prisma.chapter.findMany({
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
      this.prisma.chapter.count({ where }),
    ]);

    const ttsRows = chapters.length
      ? await this.prisma.textToSpeech.findMany({
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

  private async findNavigation(bookId: string, orderIndex: number) {
    const [previous, next] = await Promise.all([
      this.prisma.chapter.findFirst({
        where: { bookId, isDeleted: false, orderIndex: { lt: orderIndex } },
        select: { id: true, title: true, slug: true, orderIndex: true },
        orderBy: [{ orderIndex: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.chapter.findFirst({
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

  private toChapterResult(row: ChapterPageRow): ChapterResult {
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
