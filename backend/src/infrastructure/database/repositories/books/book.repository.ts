import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { Book as BookEntity } from '@/domain/books/entities/book.entity';
import { BookFilter, IBookRepository, PaginationOptions, SortOptions } from '@/domain/books/repositories/book.repository.interface';
import { AuthorId } from '@/domain/books/value-objects/author-id.vo';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import { GenreId } from '@/domain/books/value-objects/genre-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../../schemas/book.schema';
import { BookMapper } from './book.mapper';
import { RawBookDocument } from './book.raw-types';
import { BookListReadModel } from '@/domain/books/read-models/book-list.read-model';

@Injectable()
export class BookRepository implements IBookRepository {
    constructor(@InjectModel(Book.name) private readonly bookModel: Model<BookDocument>) { }

    async findById(id: BookId): Promise<BookEntity | null> {
        const document = await this.bookModel.findById(id.toString()).populate('genres').lean().exec();
        return document ? BookMapper.toDomain(document) : null;
    }

    async findBySlug(slug: string): Promise<BookEntity | null> {
        const document = await this.bookModel.findOne({ slug, isDeleted: false }).populate('genres').lean().exec();
        return document ? BookMapper.toDomain(document) : null;
    }

    async findByTitle(title: BookTitle): Promise<BookEntity | null> {
        const document = await this.bookModel.findOne({ title: title.toString(), isDeleted: false }).lean().exec();
        return document ? BookMapper.toDomain(document) : null;
    }

    private buildQueryFilter(filter: BookFilter): FilterQuery<BookDocument> {
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

        return queryFilter;
    }

    async findAll(filter: BookFilter, pagination: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<BookEntity>> {
        const queryFilter = this.buildQueryFilter(filter);
        const skip = (pagination.page - 1) * pagination.limit;
        const total = await this.bookModel.countDocuments(queryFilter).exec();

        let query = this.bookModel.find(queryFilter);

        if (sort?.sortBy) {
            const sortOrder = sort.order === 'desc' ? -1 : 1;
            query = query.sort({ [sort.sortBy]: sortOrder });
        } else {
            query = query.sort({ createdAt: -1 });
        }

        const documents = await query
            .skip(skip)
            .limit(pagination.limit)
            .lean()
            .exec() as unknown as RawBookDocument[];

        return {
            data: documents.map(doc => BookMapper.toDomain(doc)),
            meta: {
                current: pagination.page,
                pageSize: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit),
            },
        };
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
                    from: 'authors',
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
        const document = BookMapper.toPersistence(book);
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

    async findByIds(ids: BookId[]): Promise<BookEntity[]> {
        const objectIds = ids.map(id => id.toString());
        const documents = await this.bookModel.find({
            _id: { $in: objectIds },
            isDeleted: false
        }).populate('authorId', 'name avatar')
            .lean()
            .exec() as unknown as RawBookDocument[];

        return documents.map(doc => BookMapper.toDomain(doc));
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

