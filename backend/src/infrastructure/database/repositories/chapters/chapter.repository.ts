import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { Chapter as ChapterEntity } from '@/domain/chapters/entities/chapter.entity';
import { ChapterDetailReadModel } from '@/domain/chapters/read-models/chapter-detail.read-model';
import { ChapterListReadModel } from '@/domain/chapters/read-models/chapter-list.read-model';
import { ChapterFilter, IChapterRepository, PaginationOptions, SortOptions } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/domain/chapters/value-objects/book-id.vo';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { ChapterTitle } from '@/domain/chapters/value-objects/chapter-title.vo';
import { Chapter, ChapterDocument } from '@/infrastructure/database/schemas/chapter.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { Book, BookDocument } from '../../schemas/book.schema';
import { BookMapper } from '../books/book.mapper';
import { RawBookDocument } from '../books/book.mapper';
import { RawChapterDocument, RawChapterPersistence } from './chapter.mapper';

@Injectable()
export class ChapterRepository implements IChapterRepository {
    constructor(
        @InjectModel(Chapter.name) private readonly chapterModel: Model<ChapterDocument>,
        @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    ) { }

    async findById(id: ChapterId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findById(id.toString()).lean().exec() as unknown as RawChapterDocument | null;
        return document ? this.mapToEntity(document) : null;
    }

    async findBySlug(slug: string, bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            slug,
            bookId: new Types.ObjectId(bookId.toString())
        }).lean().exec() as unknown as RawChapterDocument | null;
        return document ? this.mapToEntity(document) : null;
    }

    async findByTitle(title: ChapterTitle, bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            title: title.toString(),
            bookId: new Types.ObjectId(bookId.toString())
        }).lean().exec() as unknown as RawChapterDocument | null;
        return document ? this.mapToEntity(document) : null;
    }

    async findAll(filter: ChapterFilter, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<ChapterEntity>> {
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

        const pipeline: PipelineStage[] = [];

        if (filter.minWordCount !== undefined || filter.maxWordCount !== undefined) {
            const wordCountMatch: { $gte?: number; $lte?: number } = {};
            if (filter.minWordCount !== undefined) {
                wordCountMatch.$gte = filter.minWordCount;
            }
            if (filter.maxWordCount !== undefined) {
                wordCountMatch.$lte = filter.maxWordCount;
            }

            pipeline.push({
                $addFields: {
                    wordCount: {
                        $reduce: {
                            input: '$paragraphs',
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$$value',
                                    { $size: { $split: [{ $trim: { input: '$$this.content' } }, ' '] } }
                                ]
                            }
                        }
                    }
                }
            });

            pipeline.push({
                $match: { wordCount: wordCountMatch }
            });
        }

        if (Object.keys(queryFilter).length > 0) {
            pipeline.push({ $match: queryFilter });
        }

        if (sort?.sortBy) {
            const sortOrder = sort.order === 'desc' ? -1 : 1;
            pipeline.push({ $sort: { [sort.sortBy]: sortOrder } });
        } else {
            pipeline.push({ $sort: { orderIndex: 1 } });
        }

        const skip = (pagination.page - 1) * pagination.limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: pagination.limit });

        const countPipeline = pipeline.slice(0, -2);
        countPipeline.push({ $count: 'total' });

        const [countResult, documents] = await Promise.all([
            this.chapterModel.aggregate(countPipeline).exec(),
            this.chapterModel.aggregate(pipeline).exec()
        ]);

        const total = countResult.length > 0 ? countResult[0].total : 0;

        return {
            data: documents.map(doc => this.mapToEntity(doc as RawChapterDocument)),
            meta: {
                current: pagination.page,
                pageSize: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit),
            },
        };
    }

    async findByBook(bookId: BookId, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<ChapterEntity>> {
        return this.findAll({ bookId: bookId.toString() }, pagination, sort);
    }

    async findByBookSlug(bookSlug: string, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<ChapterEntity>> {
        const book = await this.bookModel.findOne({ slug: bookSlug, isDeleted: false }).select('_id').lean().exec();

        if (!book) {
            return {
                data: [],
                meta: {
                    current: pagination.page,
                    pageSize: pagination.limit,
                    total: 0,
                    totalPages: 0,
                },
            };
        }

        return this.findAll({ bookId: book._id.toString() }, pagination, sort);
    }

    async findListByBookSlug(bookSlug: string, pagination: PaginationOptions, sort?: SortOptions): Promise<ChapterListReadModel> {
        const bookDocument = await this.bookModel.findOne({ slug: bookSlug }).select('title slug coverUrl authorId').lean().exec();
        if (!bookDocument) {
            throw new Error('Book not found');
        }

        const result = await this.findAll({ bookId: bookDocument._id.toString() }, pagination, sort);

        return {
            book: {
                id: bookDocument._id.toString(),
                title: bookDocument.title,
                slug: bookDocument.slug,
                coverUrl: bookDocument.coverUrl,
                authorId: bookDocument.authorId?.toString() || ''
            },
            chapters: result.data.map(chapter => ({
                id: chapter.id.toString(),
                title: chapter.title.toString(),
                slug: chapter.slug,
                orderIndex: chapter.orderIndex.getValue(),
                viewsCount: chapter.viewsCount,
                createdAt: chapter.createdAt || new Date(),
                updatedAt: chapter.updatedAt || new Date()
            })),
            total: result.meta.total
        };
    }

    async findDetailBySlug(chapterSlug: string, bookSlug: string): Promise<ChapterDetailReadModel | null> {
        const bookDocument = await this.bookModel.findOne({ slug: bookSlug }).populate('genres').lean().exec() as unknown as RawBookDocument | null;
        if (!bookDocument) return null;

        const chapterDocument = await this.chapterModel.findOne({
            slug: chapterSlug,
            bookId: bookDocument._id
        }).lean().exec() as unknown as RawChapterDocument | null;
        if (!chapterDocument) return null;

        const [prevChapter, nextChapter] = await Promise.all([
            this.chapterModel.findOne({
                bookId: bookDocument._id,
                orderIndex: { $lt: chapterDocument.orderIndex }
            }).sort({ orderIndex: -1 }).select('title slug orderIndex').lean().exec() as unknown as RawChapterDocument | null,
            this.chapterModel.findOne({
                bookId: bookDocument._id,
                orderIndex: { $gt: chapterDocument.orderIndex }
            }).sort({ orderIndex: 1 }).select('title slug orderIndex').lean().exec() as unknown as RawChapterDocument | null
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
                paragraphs: (chapterDocument.paragraphs || []).map(p => ({
                    id: p._id?.toString(),
                    content: p.content
                })),
                createdAt: chapterDocument.createdAt,
                updatedAt: chapterDocument.updatedAt ?? new Date()
            },
            navigation: {
                previous: prevChapter ? {
                    id: prevChapter._id.toString(),
                    title: prevChapter.title,
                    slug: prevChapter.slug,
                    orderIndex: prevChapter.orderIndex
                } : null,
                next: nextChapter ? {
                    id: nextChapter._id.toString(),
                    title: nextChapter.title,
                    slug: nextChapter.slug,
                    orderIndex: nextChapter.orderIndex
                } : null
            }
        };
    }

    async findNextChapter(bookId: BookId, currentOrderIndex: number): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString()),
            orderIndex: { $gt: currentOrderIndex }
        }).sort({ orderIndex: 1 }).lean().exec() as unknown as RawChapterDocument | null;

        return document ? this.mapToEntity(document) : null;
    }

    async findPreviousChapter(bookId: BookId, currentOrderIndex: number): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString()),
            orderIndex: { $lt: currentOrderIndex }
        }).sort({ orderIndex: -1 }).lean().exec() as unknown as RawChapterDocument | null;

        return document ? this.mapToEntity(document) : null;
    }

    async findFirstChapter(bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString())
        }).sort({ orderIndex: 1 }).lean().exec() as unknown as RawChapterDocument | null;

        return document ? this.mapToEntity(document) : null;
    }

    async findLastChapter(bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString())
        }).sort({ orderIndex: -1 }).lean().exec() as unknown as RawChapterDocument | null;

        return document ? this.mapToEntity(document) : null;
    }

    async save(chapter: ChapterEntity): Promise<void> {
        const document = this.mapToDocument(chapter);
        await this.chapterModel.findByIdAndUpdate(
            chapter.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: ChapterId): Promise<void> {
        await this.chapterModel.findByIdAndDelete(id.toString()).exec();
    }

    async existsByTitle(title: ChapterTitle, bookId: BookId, excludeId?: ChapterId): Promise<boolean> {
        const query: FilterQuery<ChapterDocument> = {
            title: title.toString(),
            bookId: new Types.ObjectId(bookId.toString())
        };

        if (excludeId) {
            query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
        }

        const count = await this.chapterModel.countDocuments(query).exec();
        return count > 0;
    }

    async existsBySlug(slug: string, bookId: BookId, excludeId?: ChapterId): Promise<boolean> {
        const query: FilterQuery<ChapterDocument> = {
            slug,
            bookId: new Types.ObjectId(bookId.toString())
        };

        if (excludeId) {
            query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
        }

        const count = await this.chapterModel.countDocuments(query).exec();
        return count > 0;
    }

    async existsByOrderIndex(orderIndex: number, bookId: BookId, excludeId?: ChapterId): Promise<boolean> {
        const query: FilterQuery<ChapterDocument> = {
            orderIndex,
            bookId: new Types.ObjectId(bookId.toString())
        };

        if (excludeId) {
            query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
        }

        const count = await this.chapterModel.countDocuments(query).exec();
        return count > 0;
    }

    async incrementViews(id: ChapterId): Promise<void> {
        await this.chapterModel.findByIdAndUpdate(
            id.toString(),
            { $inc: { viewsCount: 1 }, updatedAt: new Date() }
        ).exec();
    }

    async countByBook(bookId: BookId): Promise<number> {
        return await this.chapterModel.countDocuments({
            bookId: new Types.ObjectId(bookId.toString())
        }).exec();
    }

    async countChaptersForBooks(bookIds: string[]): Promise<Map<string, number>> {
        const objectIds = bookIds.map(id => new Types.ObjectId(id));
        const results = await this.chapterModel.aggregate([
            { $match: { bookId: { $in: objectIds } } },
            { $group: { _id: '$bookId', count: { $sum: 1 } } }
        ]).exec();

        const map = new Map<string, number>();
        results.forEach(item => {
            map.set(item._id.toString(), item.count);
        });
        return map;
    }

    async countTotal(): Promise<number> {
        return await this.chapterModel.countDocuments().exec();
    }

    async getTotalViewsByBook(bookId: BookId): Promise<number> {
        const result = await this.chapterModel.aggregate([
            { $match: { bookId: new Types.ObjectId(bookId.toString()) } },
            { $group: { _id: null, totalViews: { $sum: '$viewsCount' } } }
        ]).exec();

        return result.length > 0 ? result[0].totalViews : 0;
    }

    async getTotalWordsByBook(bookId: BookId): Promise<number> {
        const result = await this.chapterModel.aggregate([
            { $match: { bookId: new Types.ObjectId(bookId.toString()) } },
            { $unwind: '$paragraphs' },
            { $project: { wordCount: { $size: { $split: [{ $trim: { input: '$paragraphs.content' } }, ' '] } } } },
            { $group: { _id: null, totalWords: { $sum: '$wordCount' } } }
        ]).exec();

        return result.length > 0 ? result[0].totalWords : 0;
    }

    async getMaxOrderIndex(bookId: BookId): Promise<number> {
        const chapter = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString())
        }).sort({ orderIndex: -1 }).select('orderIndex').lean().exec();

        return chapter ? chapter.orderIndex : 0;
    }

    async reorderChapters(bookId: BookId, chapterOrders: Array<{ id: string; orderIndex: number }>): Promise<void> {
        const bulkOps = chapterOrders.map(({ id, orderIndex }) => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(id), bookId: new Types.ObjectId(bookId.toString()) },
                update: { $set: { orderIndex, updatedAt: new Date() } }
            }
        }));

        await this.chapterModel.bulkWrite(bulkOps);
    }

    private mapToEntity(document: RawChapterDocument): ChapterEntity {
        return ChapterEntity.reconstitute({
            id: document._id.toString(),
            title: document.title,
            slug: document.slug,
            bookId: document.bookId?.toString() || '',
            paragraphs: (document.paragraphs || []).map(p => ({
                id: p._id?.toString(),
                content: p.content
            })),
            viewsCount: document.viewsCount || 0,
            orderIndex: document.orderIndex || 0,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt ?? new Date(),
        });
    }

    private mapToDocument(chapter: ChapterEntity): RawChapterPersistence {
        return {
            title: chapter.title.toString(),
            slug: chapter.slug,
            bookId: new Types.ObjectId(chapter.bookId.toString()),
            paragraphs: chapter.paragraphs.map(p => ({
                content: p.content
            })),
            viewsCount: chapter.viewsCount,
            orderIndex: chapter.orderIndex.getValue(),
            updatedAt: chapter.updatedAt,
        };
    }
}
