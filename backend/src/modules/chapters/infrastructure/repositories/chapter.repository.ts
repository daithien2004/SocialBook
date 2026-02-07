import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../schemas/chapter.schema';
import { IChapterRepository, ChapterFilter, PaginationOptions, SortOptions } from '../../domain/repositories/chapter.repository.interface';
import { Chapter as ChapterEntity } from '../../domain/entities/chapter.entity';
import { ChapterId } from '../../domain/value-objects/chapter-id.vo';
import { ChapterTitle } from '../../domain/value-objects/chapter-title.vo';
import { BookId } from '../../domain/value-objects/book-id.vo';
import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';

@Injectable()
export class ChapterRepository implements IChapterRepository {
    constructor(@InjectModel(Chapter.name) private readonly chapterModel: Model<ChapterDocument>) {}

    async findById(id: ChapterId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findById(id.toString()).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findBySlug(slug: string, bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({ 
            slug, 
            bookId: new Types.ObjectId(bookId.toString()) 
        }).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByTitle(title: ChapterTitle, bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({ 
            title: title.toString(), 
            bookId: new Types.ObjectId(bookId.toString()) 
        }).lean().exec();
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

        // Word count filtering (aggregation pipeline)
        let pipeline: any[] = [];
        
        if (filter.minWordCount !== undefined || filter.maxWordCount !== undefined) {
            const wordCountMatch: any = {};
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

        // Add sorting
        if (sort?.sortBy) {
            const sortOrder = sort.order === 'desc' ? -1 : 1;
            pipeline.push({ $sort: { [sort.sortBy]: sortOrder } });
        } else {
            pipeline.push({ $sort: { orderIndex: 1 } });
        }

        // Add pagination
        const skip = (pagination.page - 1) * pagination.limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: pagination.limit });

        // Get total count
        const countPipeline = pipeline.slice(0, -2); // Remove skip and limit for count
        countPipeline.push({ $count: 'total' });
        
        const [countResult, documents] = await Promise.all([
            this.chapterModel.aggregate(countPipeline).exec(),
            this.chapterModel.aggregate(pipeline).exec()
        ]);

        const total = countResult.length > 0 ? countResult[0].total : 0;

        return {
            data: documents.map(doc => this.mapToEntity(doc)),
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
        // This would require joining with books collection - for now, return empty
        // In a real implementation, you'd use $lookup or a separate query
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

    async findNextChapter(bookId: BookId, currentOrderIndex: number): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString()),
            orderIndex: { $gt: currentOrderIndex }
        }).sort({ orderIndex: 1 }).lean().exec();
        
        return document ? this.mapToEntity(document) : null;
    }

    async findPreviousChapter(bookId: BookId, currentOrderIndex: number): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString()),
            orderIndex: { $lt: currentOrderIndex }
        }).sort({ orderIndex: -1 }).lean().exec();
        
        return document ? this.mapToEntity(document) : null;
    }

    async findFirstChapter(bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString())
        }).sort({ orderIndex: 1 }).lean().exec();
        
        return document ? this.mapToEntity(document) : null;
    }

    async findLastChapter(bookId: BookId): Promise<ChapterEntity | null> {
        const document = await this.chapterModel.findOne({
            bookId: new Types.ObjectId(bookId.toString())
        }).sort({ orderIndex: -1 }).lean().exec();
        
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

    private mapToEntity(document: any): ChapterEntity {
        return ChapterEntity.reconstitute({
            id: document._id.toString(),
            title: document.title,
            slug: document.slug,
            bookId: document.bookId?.toString() || '',
            paragraphs: (document.paragraphs || []).map((p: any) => ({
                id: p._id?.toString() || p.id,
                content: p.content
            })),
            viewsCount: document.viewsCount || 0,
            orderIndex: document.orderIndex || 0,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        });
    }

    private mapToDocument(chapter: ChapterEntity): any {
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
