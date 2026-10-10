import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';
import { ChapterDetailReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-detail.read-model';
import {
  ChapterFilter,
  ChapterSortField,
} from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { ChapterListReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-list.read-model';
import {
  Chapter,
  ChapterDocument,
} from '@/modules/chapters/infrastructure/schemas/chapter.schema';
import {
  Book,
  BookDocument,
} from '@/modules/books/infrastructure/schemas/public-api';
import {
  BookMapper,
  RawBookDocument,
} from '@/modules/books/infrastructure/repositories/books/public-api';
import {
  TextToSpeech,
  TextToSpeechDocument,
} from '@/modules/text-to-speech/infrastructure/schemas/public-api';
import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { RawChapterDocument } from './chapter.mapper';

interface ChapterListRow {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  orderIndex: number;
  viewsCount: number;
  paragraphs: Array<{ _id: Types.ObjectId }>;
  createdAt: Date;
  updatedAt: Date;
}

interface LatestChapterAudio {
  _id: Types.ObjectId;
  audioUrl?: string;
}

interface ChapterNavigationRow {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  orderIndex: number;
}

interface PopulatedBookPaths {
  genres: Array<{
    _id: Types.ObjectId;
    name: string;
    slug: string;
  }>;
  authorId: { _id: Types.ObjectId; name: string };
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
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(TextToSpeech.name)
    private readonly ttsModel: Model<TextToSpeechDocument>,
  ) {}

  async findDetailBySlug(
    chapterSlug: string,
    bookSlug: string,
  ): Promise<ChapterDetailReadModel | null> {
    const bookDocument = await this.bookModel
      .findOne({ slug: bookSlug })
      .populate<Pick<PopulatedBookPaths, 'genres'>>('genres')
      .populate<Pick<PopulatedBookPaths, 'authorId'>>('authorId', 'name')
      .lean<RawBookDocument>()
      .exec();
    if (!bookDocument) return null;

    const chapterDocument = await this.chapterModel
      .findOne({ slug: chapterSlug, bookId: bookDocument._id })
      .lean<RawChapterDocument>()
      .exec();
    if (!chapterDocument) return null;

    const [previousChapter, nextChapter] = await Promise.all([
      this.chapterModel
        .findOne({
          bookId: bookDocument._id,
          orderIndex: { $lt: chapterDocument.orderIndex },
        })
        .sort({ orderIndex: -1, _id: -1 })
        .select('title slug orderIndex')
        .lean<ChapterNavigationRow>()
        .exec(),
      this.chapterModel
        .findOne({
          bookId: bookDocument._id,
          orderIndex: { $gt: chapterDocument.orderIndex },
        })
        .sort({ orderIndex: 1, _id: 1 })
        .select('title slug orderIndex')
        .lean<ChapterNavigationRow>()
        .exec(),
    ]);

    return {
      book: BookMapper.toListReadModel(bookDocument),
      chapter: {
        id: chapterDocument._id.toString(),
        bookId: chapterDocument.bookId.toString(),
        title: chapterDocument.title,
        slug: chapterDocument.slug,
        orderIndex: chapterDocument.orderIndex,
        viewsCount: chapterDocument.viewsCount || 0,
        paragraphs: chapterDocument.paragraphs.map((paragraph) => ({
          id: paragraph._id.toString(),
          content: paragraph.content,
        })),
        createdAt: chapterDocument.createdAt,
        updatedAt: chapterDocument.updatedAt,
      },
      navigation: {
        previous: previousChapter
          ? {
              id: previousChapter._id.toString(),
              title: previousChapter.title,
              slug: previousChapter.slug,
              orderIndex: previousChapter.orderIndex,
            }
          : null,
        next: nextChapter
          ? {
              id: nextChapter._id.toString(),
              title: nextChapter.title,
              slug: nextChapter.slug,
              orderIndex: nextChapter.orderIndex,
            }
          : null,
      },
    };
  }

  async findPaginated(
    chapterFilter: ChapterFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<ChapterResult>> {
    const filter: FilterQuery<ChapterDocument> = {};
    if (chapterFilter.title) {
      filter.title = { $regex: chapterFilter.title, $options: 'i' };
    }
    if (chapterFilter.bookId) {
      filter.bookId = new Types.ObjectId(chapterFilter.bookId);
    }
    if (chapterFilter.orderIndex !== undefined) {
      filter.orderIndex = chapterFilter.orderIndex;
    }

    const page = this.positiveInteger(pagination.page, 1);
    const limit = Math.min(this.positiveInteger(pagination.limit, 10), 1000);
    const { sortField, direction } = this.resolveSort(sort);
    const [rows, total] = await Promise.all([
      this.chapterModel
        .find(filter)
        .sort({ [sortField]: direction, _id: direction })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<RawChapterDocument[]>()
        .exec(),
      this.chapterModel.countDocuments(filter).exec(),
    ]);

    return {
      data: rows.map((row) => this.toChapterResult(row)),
      meta: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findListByBookSlug(
    bookSlug: string,
    pagination: PaginationOptions,
  ): Promise<ChapterListReadModel> {
    const book = await this.bookModel
      .findOne({ slug: bookSlug })
      .select('title slug coverUrl authorId')
      .lean()
      .exec();

    if (!book) throw new NotFoundException('Book not found');

    const page = this.positiveInteger(pagination.page, 1);
    const limit = Math.min(this.positiveInteger(pagination.limit, 10), 1000);
    const filter: FilterQuery<ChapterDocument> = { bookId: book._id };

    const [chapters, total] = await Promise.all([
      this.chapterModel
        .find(filter)
        .select(
          'title slug orderIndex viewsCount paragraphs._id createdAt updatedAt',
        )
        .sort({ orderIndex: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<ChapterListRow[]>()
        .exec(),
      this.chapterModel.countDocuments(filter).exec(),
    ]);

    const chapterIds = chapters.map((chapter) => chapter._id);
    const ttsRows = chapterIds.length
      ? await this.ttsModel
          .aggregate<LatestChapterAudio>([
            {
              $match: {
                chapterId: { $in: chapterIds },
                status: 'completed',
              },
            },
            { $sort: { createdAt: -1, _id: -1 } },
            {
              $group: {
                _id: '$chapterId',
                audioUrl: { $first: '$audioUrl' },
              },
            },
          ])
          .exec()
      : [];

    const audioByChapter = new Map<string, { audioUrl?: string }>();
    for (const tts of ttsRows) {
      audioByChapter.set(tts._id.toString(), { audioUrl: tts.audioUrl });
    }

    return {
      book: {
        id: book._id.toString(),
        title: book.title,
        slug: book.slug,
        coverUrl: book.coverUrl,
        authorId: book.authorId.toString(),
      },
      chapters: chapters.map((chapter) => {
        const tts = audioByChapter.get(chapter._id.toString());
        return {
          id: chapter._id.toString(),
          title: chapter.title,
          slug: chapter.slug,
          orderIndex: chapter.orderIndex,
          viewsCount: chapter.viewsCount || 0,
          paragraphsCount: chapter.paragraphs.length,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt,
          ttsStatus: tts ? 'completed' : undefined,
          audioUrl: tts?.audioUrl,
        };
      }),
      total,
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
    direction: 1 | -1;
  } {
    const sortField = sort?.sortBy ?? 'orderIndex';
    if (!isChapterSortField(sortField)) {
      throw new BadRequestException(
        `Unsupported chapter sort field: ${sortField}`,
      );
    }

    return {
      sortField,
      direction: sort?.sortBy ? (sort.order === 'desc' ? -1 : 1) : 1,
    };
  }

  private toChapterResult(document: RawChapterDocument): ChapterResult {
    const paragraphs = document.paragraphs.map((paragraph) => ({
      id: paragraph._id.toString(),
      content: paragraph.content,
    }));
    const firstParagraph = paragraphs[0]?.content ?? '';

    return {
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      bookId: document.bookId.toString(),
      paragraphs,
      viewsCount: document.viewsCount,
      orderIndex: document.orderIndex,
      characterCount: paragraphs.reduce(
        (count, paragraph) => count + paragraph.content.length,
        0,
      ),
      contentPreview:
        firstParagraph.length <= 200
          ? firstParagraph
          : `${firstParagraph.substring(0, 200)}...`,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
