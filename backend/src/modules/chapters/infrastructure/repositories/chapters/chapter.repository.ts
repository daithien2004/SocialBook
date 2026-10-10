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
import {
  Chapter,
  ChapterDocument,
} from '@/modules/chapters/infrastructure/schemas/chapter.schema';
import { Injectable } from '@nestjs/common';
import { ConcurrencyException } from '@/shared/domain/common-exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  Book,
  BookDocument,
} from '@/modules/books/infrastructure/schemas/public-api';
import { RawChapterDocument, RawChapterPersistence } from './chapter.mapper';

@Injectable()
export class ChapterRepository implements IChapterRepository {
  constructor(
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
  ) {}

  async findById(id: ChapterId): Promise<ChapterEntity | null> {
    const document = (await this.chapterModel
      .findById(id.toString())
      .lean()
      .exec()) as unknown as RawChapterDocument | null;
    return document ? this.mapToEntity(document) : null;
  }

  async findByParagraphId(paragraphId: string): Promise<ChapterEntity | null> {
    const document = (await this.chapterModel
      .findOne({ 'paragraphs._id': new Types.ObjectId(paragraphId) })
      .lean()
      .exec()) as unknown as RawChapterDocument | null;
    return document ? this.mapToEntity(document) : null;
  }

  async findBySlug(
    slug: string,
    bookId: BookId,
  ): Promise<ChapterEntity | null> {
    const document = (await this.chapterModel
      .findOne({
        slug,
        bookId: new Types.ObjectId(bookId.toString()),
      })
      .lean()
      .exec()) as unknown as RawChapterDocument | null;
    return document ? this.mapToEntity(document) : null;
  }

  async findByTitle(
    title: ChapterTitle,
    bookId: BookId,
  ): Promise<ChapterEntity | null> {
    const document = (await this.chapterModel
      .findOne({
        title: title.toString(),
        bookId: new Types.ObjectId(bookId.toString()),
      })
      .lean()
      .exec()) as unknown as RawChapterDocument | null;
    return document ? this.mapToEntity(document) : null;
  }

  async findAll(
    filter: ChapterFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<ChapterEntity>> {
    const queryFilter: FilterQuery<ChapterDocument> = {};

    if (filter.title) {
      queryFilter.title = { $regex: filter.title, $options: 'i' };
    }

    if (filter.bookId) {
      queryFilter.bookId = new Types.ObjectId(filter.bookId);
    }

    if (filter.orderIndex !== undefined) {
      queryFilter.orderIndex = filter.orderIndex;
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(Math.max(1, pagination.limit || 10), 10000);
    const sortField = sort?.sortBy ?? 'orderIndex';
    const sortDirection = sort?.order === 'desc' ? -1 : 1;
    const [documents, total] = await Promise.all([
      this.chapterModel
        .find(queryFilter)
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<RawChapterDocument[]>()
        .exec(),
      this.chapterModel.countDocuments(queryFilter).exec(),
    ]);

    return {
      data: documents.map((document) => this.mapToEntity(document)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByBook(
    bookId: BookId,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<ChapterEntity>> {
    return this.findAll({ bookId: bookId.toString() }, pagination, sort);
  }

  async findFirstChapter(bookId: BookId): Promise<ChapterEntity | null> {
    const document = (await this.chapterModel
      .findOne({
        bookId: new Types.ObjectId(bookId.toString()),
      })
      .sort({ orderIndex: 1 })
      .lean()
      .exec()) as unknown as RawChapterDocument | null;

    return document ? this.mapToEntity(document) : null;
  }

  async save(chapter: ChapterEntity): Promise<void> {
    const persistenceData = this.mapToDocument(chapter);
    const id = new Types.ObjectId(chapter.id.toString());

    if (chapter.isNew) {
      await this.chapterModel.create({
        ...persistenceData,
        _id: id,
        version: 0,
      });
      chapter.markPersisted(0);
      return;
    }

    if (!chapter.isDirty) return;

    const nextVersion = chapter.loadedVersion + 1;
    const filter: FilterQuery<ChapterDocument> = {
      _id: id,
      version: chapter.loadedVersion,
    };
    if (chapter.loadedVersion === 0) {
      filter.$or = [{ version: 0 }, { version: { $exists: false } }];
    }

    const result = await this.chapterModel
      .updateOne(filter, {
        $set: { ...persistenceData, version: nextVersion },
      })
      .exec();

    if (result.matchedCount === 0) {
      throw new ConcurrencyException('Chapter changed after it was loaded');
    }

    chapter.markPersisted(nextVersion);
  }

  async delete(id: ChapterId, expectedVersion: number): Promise<void> {
    const filter: FilterQuery<ChapterDocument> = {
      _id: new Types.ObjectId(id.toString()),
      version: expectedVersion,
    };
    if (expectedVersion === 0) {
      filter.$or = [{ version: 0 }, { version: { $exists: false } }];
    }

    const result = await this.chapterModel.deleteOne(filter).exec();
    if (result.deletedCount === 0) {
      throw new ConcurrencyException('Chapter changed before it was deleted');
    }
  }

  async existsByTitle(
    title: ChapterTitle,
    bookId: BookId,
    excludeId?: ChapterId,
  ): Promise<boolean> {
    const query: FilterQuery<ChapterDocument> = {
      title: title.toString(),
      bookId: new Types.ObjectId(bookId.toString()),
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
    }

    const count = await this.chapterModel.countDocuments(query).exec();
    return count > 0;
  }

  async existsByOrderIndex(
    orderIndex: number,
    bookId: BookId,
    excludeId?: ChapterId,
  ): Promise<boolean> {
    const query: FilterQuery<ChapterDocument> = {
      orderIndex,
      bookId: new Types.ObjectId(bookId.toString()),
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
    }

    const count = await this.chapterModel.countDocuments(query).exec();
    return count > 0;
  }

  async incrementViews(id: ChapterId): Promise<void> {
    await this.chapterModel
      .findByIdAndUpdate(id.toString(), {
        $inc: { viewsCount: 1, version: 1 },
        updatedAt: new Date(),
      })
      .exec();
  }

  async incrementViewsBySlug(
    bookSlug: string,
    chapterSlug: string,
  ): Promise<void> {
    const book = await this.bookModel
      .findOne({ slug: bookSlug })
      .select('_id')
      .lean()
      .exec();
    if (!book) return;

    await this.chapterModel
      .findOneAndUpdate(
        { slug: chapterSlug, bookId: book._id },
        { $inc: { viewsCount: 1, version: 1 }, updatedAt: new Date() },
      )
      .exec();
  }

  async countByBook(bookId: BookId): Promise<number> {
    return await this.chapterModel
      .countDocuments({
        bookId: new Types.ObjectId(bookId.toString()),
      })
      .exec();
  }

  async countChaptersForBooks(bookIds: string[]): Promise<Map<string, number>> {
    const objectIds = bookIds.map((id) => new Types.ObjectId(id));
    const results = await this.chapterModel
      .aggregate<{
        _id: Types.ObjectId;
        count: number;
      }>([
        { $match: { bookId: { $in: objectIds } } },
        { $group: { _id: '$bookId', count: { $sum: 1 } } },
      ])
      .exec();

    const map = new Map<string, number>();
    results.forEach((item) => {
      map.set(item._id.toString(), item.count);
    });
    return map;
  }

  async countTotal(): Promise<number> {
    return await this.chapterModel.countDocuments().exec();
  }

  async getMaxOrderIndex(bookId: BookId): Promise<number> {
    const chapter = await this.chapterModel
      .findOne({
        bookId: new Types.ObjectId(bookId.toString()),
      })
      .sort({ orderIndex: -1 })
      .select('orderIndex')
      .lean()
      .exec();

    return chapter ? chapter.orderIndex : 0;
  }

  async updateTtsStatus(
    chapterId: string,
    ttsStatus: 'pending' | 'processing' | 'completed' | 'failed',
    audioUrl?: string,
  ): Promise<void> {
    const setData: Record<string, unknown> = {
      ttsStatus,
      updatedAt: new Date(),
    };
    if (audioUrl) {
      setData.audioUrl = audioUrl;
    }
    await this.chapterModel
      .findByIdAndUpdate(chapterId, { $set: setData, $inc: { version: 1 } })
      .exec();
  }

  private mapToEntity(document: RawChapterDocument): ChapterEntity {
    return ChapterEntity.reconstitute({
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      bookId: document.bookId?.toString() || '',
      paragraphs: (document.paragraphs || []).map((p) => ({
        id: p._id?.toString(),
        content: p.content,
      })),
      viewsCount: document.viewsCount || 0,
      orderIndex: document.orderIndex || 0,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt ?? new Date(),
      version: document.version,
      ttsStatus: document.ttsStatus,
      audioUrl: document.audioUrl,
    });
  }

  private mapToDocument(chapter: ChapterEntity): RawChapterPersistence {
    return {
      title: chapter.title.toString(),
      slug: chapter.slug,
      bookId: new Types.ObjectId(chapter.bookId.toString()),
      paragraphs: chapter.paragraphs.map((p) => ({
        _id: new Types.ObjectId(p.id),
        content: p.content,
      })),
      viewsCount: chapter.viewsCount,
      orderIndex: chapter.orderIndex.getValue(),
      version: chapter.loadedVersion,
      updatedAt: chapter.updatedAt,
      ttsStatus: chapter.ttsStatus,
      audioUrl: chapter.audioUrl,
    };
  }
}
