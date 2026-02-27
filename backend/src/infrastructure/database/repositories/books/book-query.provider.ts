import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { BookListReadModel } from '@/domain/books/read-models/book-list.read-model';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { BookFilter, PaginationOptions, SortOptions } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../../schemas/book.schema';
import { BookMapper } from './book.mapper';

@Injectable()
export class BookQueryProvider implements IBookQueryProvider {
    constructor(@InjectModel(Book.name) private readonly bookModel: Model<BookDocument>) { }

    private buildQueryFilter(filter: BookFilter): FilterQuery<BookDocument> {
        const queryFilter: FilterQuery<BookDocument> = { isDeleted: false };

        if (filter.title) queryFilter.title = { $regex: filter.title, $options: 'i' };
        if (filter.authorId) queryFilter.authorId = filter.authorId;
        if (filter.genres && filter.genres.length > 0) queryFilter.genres = { $in: filter.genres };
        if (filter.tags && filter.tags.length > 0) queryFilter.tags = { $in: filter.tags };
        if (filter.status) queryFilter.status = filter.status;
        if (filter.search) queryFilter.$text = { $search: filter.search };
        if (filter.publishedYear) queryFilter.publishedYear = filter.publishedYear;
        if (filter.ids && filter.ids.length > 0) {
            queryFilter._id = { $in: filter.ids.map(id => new Types.ObjectId(id)) };
        }

        return queryFilter;
    }

    async findAllList(filter: BookFilter, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<BookListReadModel>> {
        const queryFilter = this.buildQueryFilter(filter);
        const skip = (pagination.page - 1) * pagination.limit;
        const total = await this.bookModel.countDocuments(queryFilter).exec();

        const sortStage: Record<string, 1 | -1> = sort?.sortBy
            ? { [sort.sortBy]: (sort.order === 'desc' ? -1 : 1) as 1 | -1 }
            : { createdAt: -1 };

        const documents = await this.bookModel.aggregate([
            { $match: queryFilter },
            { $sort: sortStage },
            { $skip: skip },
            { $limit: pagination.limit },
            {
                $lookup: {
                    from: 'genres',
                    localField: 'genres',
                    foreignField: '_id',
                    as: 'genres',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'authorId',
                    foreignField: '_id',
                    pipeline: [{ $project: { _id: 1, name: 1 } }],
                    as: '_authorArr',
                },
            },
            {
                $addFields: {
                    authorId: { $arrayElemAt: ['$_authorArr', 0] },
                },
            },
            {
                $lookup: {
                    from: 'chapters',
                    localField: '_id',
                    foreignField: 'bookId',
                    pipeline: [{ $project: { _id: 1 } }],
                    as: '_chapters',
                },
            },
            {
                $addFields: {
                    chapterCount: { $size: '$_chapters' },
                },
            },
            { $project: { _chapters: 0, _authorArr: 0 } },
        ]).exec();

        return {
            data: documents.map(doc => BookMapper.toListReadModel(doc)),
            meta: {
                current: pagination.page,
                pageSize: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit),
            },
        };
    }

    async findDetailBySlug(slug: string): Promise<BookDetailReadModel | null> {
        const results = await this.bookModel.aggregate([
            { $match: { slug, isDeleted: false } },
            {
                $lookup: {
                    from: 'genres',
                    localField: 'genres',
                    foreignField: '_id',
                    as: 'genreDetails',
                },
            },
            {
                $lookup: {
                    from: 'chapters',
                    localField: '_id',
                    foreignField: 'bookId',
                    as: 'chapters',
                },
            },
            {
                $addFields: {
                    chapters: {
                        $sortArray: { input: '$chapters', sortBy: { orderIndex: 1 } },
                    },
                },
            },
        ]).exec();

        if (!results || results.length === 0) return null;

        return BookMapper.toDetailReadModel(results[0]);
    }

    async getGrowthMetrics(startDate: Date, groupBy: 'day' | 'month' | 'year'): Promise<Array<{ _id: string; count: number }>> {
        let dateFormat: string;
        switch (groupBy) {
            case 'month': dateFormat = '%Y-%m'; break;
            case 'year': dateFormat = '%Y'; break;
            case 'day': default: dateFormat = '%Y-%m-%d'; break;
        }

        return await this.bookModel.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).exec();
    }

    async searchFuzzy(query: string, limit: number = 30): Promise<Array<{ id: BookId; score: number; matchType: string }>> {
        const results: Array<{ id: BookId; score: number; matchType: string }> = [];
        const normalizedQuery = this.normalizeText(query);

        if (normalizedQuery.length < 2) return results;

        const originalWords = query.trim().split(/\s+/).filter(w => w.length > 1);
        if (originalWords.length > 6) return results;

        try {
            const requiredWords = originalWords.slice(0, Math.ceil(originalWords.length * 0.7));
            const regexPattern = originalWords.length <= 3
                ? originalWords.join('.*')
                : requiredWords.join('|');

            const regex = new RegExp(regexPattern, 'i');

            const books = await this.bookModel
                .find({
                    $or: [
                        { title: { $regex: regex } },
                        { slug: { $regex: regex } },
                    ],
                    status: 'published',
                    isDeleted: false,
                })
                .select('_id title slug')
                .limit(limit)
                .lean()
                .exec();

            for (const book of books) {
                const titleSimilarity = this.calculateTextSimilarity(query, book.title);
                const slugSimilarity = this.calculateTextSimilarity(query, book.slug || '');
                const similarity = Math.max(titleSimilarity, slugSimilarity);

                if (similarity >= 0.6) {
                    let score = similarity >= 1.0 ? 15.0 : similarity >= 0.8 ? 12.0 : 10.0;
                    results.push({
                        id: BookId.create(book._id.toString()),
                        score,
                        matchType: similarity >= 1.0 ? 'exact' : similarity >= 0.8 ? 'starts_with' : 'contains',
                    });
                }
            }
        } catch (error: any) {
            console.error(`Fuzzy search error: ${error.message}`);
        }
        return results;
    }

    async searchByDescription(keywords: string[], limit: number = 10): Promise<Array<{ id: BookId; score: number }>> {
        const results: Array<{ id: BookId; score: number }> = [];
        if (!keywords || keywords.length === 0) return results;

        try {
            const regexPattern = keywords.map(w => `\\b${w}\\b`).join('|');
            const regex = new RegExp(regexPattern, 'i');

            const books = await this.bookModel
                .find({
                    description: { $regex: regex },
                    status: 'published',
                    isDeleted: false,
                })
                .select('_id title description')
                .limit(limit)
                .lean()
                .exec();

            for (const book of books) {
                const description = book.description?.toLowerCase() || '';
                const matchedWords = keywords.filter(word =>
                    description.includes(word.toLowerCase())
                );

                if (matchedWords.length > 0) {
                    const properNounMatches = matchedWords.filter(w => w[0] === w[0].toUpperCase());

                    let frequencyBonus = 0;
                    for (const word of matchedWords) {
                        const count = (description.match(new RegExp(word.toLowerCase(), 'gi')) || []).length;
                        frequencyBonus += (count - 1) * 0.2;
                    }

                    const multipleProperNounBonus = properNounMatches.length >= 2 ? 1.0 : 0;
                    const score = 8.0
                        + (properNounMatches.length * 2.0)
                        + ((matchedWords.length - properNounMatches.length) * 0.5)
                        + multipleProperNounBonus
                        + Math.min(frequencyBonus, 2.0);

                    results.push({ id: BookId.create(book._id.toString()), score });
                }
            }
        } catch (error: any) {
            console.error(`Description search error: ${error.message}`);
        }
        return results;
    }

    private normalizeText(text: string): string {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    private calculateTextSimilarity(query: string, targetText: string): number {
        if (!query || !targetText) return 0.0;

        const normalizedQuery = this.normalizeText(query);
        const normalizedTarget = this.normalizeText(targetText);

        if (normalizedTarget === normalizedQuery) {
            return 1.0;
        } else if (normalizedTarget.startsWith(normalizedQuery)) {
            return 0.8;
        } else if (normalizedTarget.includes(normalizedQuery)) {
            return 0.6;
        }
        return 0.0;
    }
}
