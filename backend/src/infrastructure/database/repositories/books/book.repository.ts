import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../../schemas/book.schema';
import { IBookRepository, BookFilter, PaginationOptions, SortOptions } from '@/domain/books/repositories/book.repository.interface';
import { Book as BookEntity } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import { AuthorId } from '@/domain/books/value-objects/author-id.vo';
import { GenreId } from '@/domain/books/value-objects/genre-id.vo';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

@Injectable()
export class BookRepository implements IBookRepository {
    constructor(@InjectModel(Book.name) private readonly bookModel: Model<BookDocument>) {}

    async findById(id: BookId): Promise<BookEntity | null> {
        const document = await this.bookModel.findById(id.toString()).populate('genres').lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findBySlug(slug: string): Promise<BookEntity | null> {
        const document = await this.bookModel.findOne({ slug, isDeleted: false }).populate('genres').lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByTitle(title: BookTitle): Promise<BookEntity | null> {
        const document = await this.bookModel.findOne({ title: title.toString(), isDeleted: false }).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findAll(filter: BookFilter, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<BookEntity>> {
        const queryFilter: FilterQuery<BookDocument> = { isDeleted: false };
        
        if (filter.title) {
            queryFilter.title = { $regex: filter.title, $options: 'i' };
        }
        
        if (filter.authorId) {
            queryFilter.authorId = filter.authorId;
        }
        
        if (filter.genres && filter.genres.length > 0) {
            queryFilter.genres = { $in: filter.genres };
        }
        
        if (filter.tags && filter.tags.length > 0) {
            queryFilter.tags = { $in: filter.tags };
        }
        
        if (filter.status) {
            queryFilter.status = filter.status;
        }
        
        if (filter.search) {
            queryFilter.$text = { $search: filter.search };
        }
        
        if (filter.publishedYear) {
            queryFilter.publishedYear = filter.publishedYear;
        }

        if (filter.ids && filter.ids.length > 0) {
            queryFilter._id = { $in: filter.ids.map(id => new Types.ObjectId(id)) };
        }

        const skip = (pagination.page - 1) * pagination.limit;
        const total = await this.bookModel.countDocuments(queryFilter).exec();
        
        let query = this.bookModel.find(queryFilter);
        
        // Apply sorting
        if (sort?.sortBy) {
            const sortOrder = sort.order === 'desc' ? -1 : 1;
            query = query.sort({ [sort.sortBy]: sortOrder });
        } else {
            query = query.sort({ createdAt: -1 });
        }
        
        const documents = await query
            .skip(skip)
            .limit(pagination.limit)
            .populate('genres')
            .lean()
            .exec();

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

    async findByAuthor(authorId: AuthorId, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<BookEntity>> {
        return this.findAll({ authorId: authorId.toString() }, pagination, sort);
    }

    async findByGenre(genreId: GenreId, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<BookEntity>> {
        return this.findAll({ genres: [genreId.toString()] }, pagination, sort);
    }

    async findPopular(pagination: PaginationOptions): Promise<PaginatedResult<BookEntity>> {
        return this.findAll({}, pagination, { sortBy: 'likes', order: 'desc' });
    }

    async findRecent(pagination: PaginationOptions): Promise<PaginatedResult<BookEntity>> {
        return this.findAll({}, pagination, { sortBy: 'createdAt', order: 'desc' });
    }

    async save(book: BookEntity): Promise<void> {
        const document = this.mapToDocument(book);
        await this.bookModel.findByIdAndUpdate(
            book.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: BookId): Promise<void> {
        await this.bookModel.findByIdAndDelete(id.toString()).exec();
    }

    async softDelete(id: BookId): Promise<void> {
        await this.bookModel.findByIdAndUpdate(
            id.toString(),
            { isDeleted: true, updatedAt: new Date() }
        ).exec();
    }

    async existsByTitle(title: BookTitle, excludeId?: BookId): Promise<boolean> {
        const query: FilterQuery<BookDocument> = { 
            title: title.toString(), 
            isDeleted: false 
        };
        
        if (excludeId) {
            query._id = { $ne: excludeId.toString() };
        }
        
        const count = await this.bookModel.countDocuments(query).exec();
        return count > 0;
    }

    async existsBySlug(slug: string, excludeId?: BookId): Promise<boolean> {
        const query: FilterQuery<BookDocument> = { 
            slug, 
            isDeleted: false 
        };
        
        if (excludeId) {
            query._id = { $ne: excludeId.toString() };
        }
        
        const count = await this.bookModel.countDocuments(query).exec();
        return count > 0;
    }

    async existsById(id: string): Promise<boolean> {
        const count = await this.bookModel.countDocuments({ _id: id, isDeleted: false }).exec();
        return count > 0;
    }

    async incrementViews(id: BookId): Promise<void> {
        await this.bookModel.findByIdAndUpdate(
            id.toString(),
            { $inc: { views: 1 }, updatedAt: new Date() }
        ).exec();
    }

    async addLike(id: BookId, userId: string): Promise<void> {
        await this.bookModel.findByIdAndUpdate(
            id.toString(),
            { 
                $inc: { likes: 1 },
                $addToSet: { likedBy: userId },
                updatedAt: new Date()
            }
        ).exec();
    }

    async removeLike(id: BookId, userId: string): Promise<void> {
        await this.bookModel.findByIdAndUpdate(
            id.toString(),
            { 
                $inc: { likes: -1 },
                $pull: { likedBy: userId },
                updatedAt: new Date()
            }
        ).exec();
    }

    async countByAuthor(authorId: AuthorId): Promise<number> {
        return await this.bookModel.countDocuments({ 
            authorId: authorId.toString(), 
            isDeleted: false 
        }).exec();
    }

    async countByGenre(genreId: string): Promise<number> {
        return await this.bookModel.countDocuments({ 
            genres: { $in: [genreId] }, 
            isDeleted: false 
        }).exec();
    }

    async countByStatus(status: 'draft' | 'published' | 'completed'): Promise<number> {
        return await this.bookModel.countDocuments({ 
            status, 
            isDeleted: false 
        }).exec();
    }

    // Statistics
    async countTotal(): Promise<number> {
        return await this.bookModel.countDocuments({ isDeleted: false }).exec();
    }

    async countByGenreName(): Promise<Array<{ genre: string; count: number }>> {
        const result = await this.bookModel.aggregate([
            { $unwind: '$genres' },
            {
                $lookup: {
                    from: 'genres',
                    localField: 'genres',
                    foreignField: '_id',
                    as: 'genreInfo'
                }
            },
            { $unwind: '$genreInfo' },
            {
                $group: {
                    _id: '$genreInfo.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).exec();

        return result.map(item => ({ genre: item._id, count: item.count }));
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

    private mapToEntity(document: any): BookEntity {
        return BookEntity.reconstitute({
            id: document._id.toString(),
            title: document.title,
            slug: document.slug,
            authorId: (document.authorId && document.authorId._id ? document.authorId._id.toString() : document.authorId?.toString()) || '',
            genres: (document.genres || []).map((g: any) => (g && g._id ? g._id.toString() : g.toString())),
            description: document.description || '',
            publishedYear: document.publishedYear || '',
            coverUrl: document.coverUrl || '',
            status: document.status || 'draft',
            tags: document.tags || [],
            views: document.views || 0,
            likes: document.likes || 0,
            likedBy: (document.likedBy || []).map((id: any) => id.toString()),
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
            genreObjects: (document.genres || []).map((g: any) => {
                if (typeof g === 'object' && g._id) {
                    return {
                        id: g._id.toString(),
                        name: g.name,
                        slug: g.slug
                    };
                }
                return null;
            }).filter((g: any) => g !== null)
        });
    }

    private mapToDocument(book: BookEntity): Partial<BookDocument> {
        return {
            title: book.title.toString(),
            slug: book.slug,
            authorId: new Types.ObjectId(book.authorId.toString()),
            genres: book.genres.map(genre => new Types.ObjectId(genre.toString())),
            description: book.description,
            publishedYear: book.publishedYear,
            coverUrl: book.coverUrl,
            status: book.status.toString(),
            tags: book.tags,
            views: book.views,
            likes: book.likes,
            likedBy: book.likedBy.map(id => new Types.ObjectId(id)),
            updatedAt: book.updatedAt,
        };
    }

    async findByIds(ids: BookId[]): Promise<BookEntity[]> {
        const objectIds = ids.map(id => id.toString());
        const documents = await this.bookModel.find({ 
            _id: { $in: objectIds },
            isDeleted: false 
        }).populate('authorId', 'name avatar') // Minimal population if needed, or rely on IDs
          .lean()
          .exec();
        
        return documents.map(doc => this.mapToEntity(doc));
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
        } catch (error) {
            // Log error but don't crash search
            console.error(`Fuzzy search error: ${error.message}`);
        }
        return results;
    }

    async searchByDescription(keywords: string[], limit: number = 10): Promise<Array<{ id: BookId; score: number }>> {
        const results: Array<{ id: BookId; score: number }> = [];
        if (!keywords || keywords.length === 0) return results;

        try {
             // Build regex pattern with word boundaries
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
        } catch (error) {
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

