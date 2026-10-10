import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Book as BookEntity } from '@/modules/books/domain/books/entities/book.entity';
import { BookListReadModel } from '@/modules/books/domain/books/read-models/book-list.read-model';
import {
  BookFilter,
  BookFilters,
  BookSearchCandidate,
  IBookRepository,
} from '@/modules/books/domain/books/repositories/book.repository.interface';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/modules/books/domain/books/value-objects/book-title.vo';
import { GenreId } from '@/modules/books/domain/books/value-objects/genre-id.vo';
import { Injectable } from '@nestjs/common';
import { ConcurrencyException } from '@/shared/domain/common-exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { Book, BookDocument } from '../../schemas/book.schema';
import { BookMapper, RawBookDocument } from './book.mapper';
import { MongoSessionContext } from '@/shared/infrastructure/mongo-session.context';

@Injectable()
export class BookRepository implements IBookRepository {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    private readonly sessionContext: MongoSessionContext,
  ) {}

  async findUnindexedBooks(limit: number): Promise<BookEntity[]> {
    const documents = await this.bookModel
      .find({
        status: 'published',
        $or: [
          { vectorIndexedAt: null },
          { vectorIndexedAt: { $exists: false } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate<{ genres: RawBookDocument['genres'] }>('genres')
      .lean<RawBookDocument[]>()
      .exec();

    return documents.map((doc) => BookMapper.toDomain(doc));
  }

  async findById(id: BookId): Promise<BookEntity | null> {
    const document = await this.bookModel
      .findById(id.toString())
      .populate<{ genres: RawBookDocument['genres'] }>('genres')
      .lean<RawBookDocument>()
      .exec();
    return document ? BookMapper.toDomain(document) : null;
  }

  async findBySlug(slug: string): Promise<BookEntity | null> {
    const document = await this.bookModel
      .findOne({ slug, isDeleted: false })
      .populate<{ genres: RawBookDocument['genres'] }>('genres')
      .lean<RawBookDocument>()
      .exec();
    return document ? BookMapper.toDomain(document) : null;
  }

  async findByTitle(title: BookTitle): Promise<BookEntity | null> {
    const document = await this.bookModel
      .findOne({ title: title.toString(), isDeleted: false })
      .lean<RawBookDocument>()
      .exec();
    return document ? BookMapper.toDomain(document) : null;
  }

  private buildQueryFilter(filter: BookFilter): FilterQuery<BookDocument> {
    const queryFilter: FilterQuery<BookDocument> = { isDeleted: false };

    if (filter.title) {
      queryFilter.title = { $regex: filter.title, $options: 'i' };
    }
    if (filter.authorIds && filter.authorIds.length > 0) {
      queryFilter.authorId = {
        $in: filter.authorIds.map((id) => new Types.ObjectId(id)),
      };
    } else if (filter.authorId) {
      queryFilter.authorId = new Types.ObjectId(filter.authorId);
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
      queryFilter._id = { $in: filter.ids.map((id) => new Types.ObjectId(id)) };
    }

    return queryFilter;
  }

  async findAll(
    filter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookEntity>> {
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

    const documents = (await query
      .skip(skip)
      .limit(pagination.limit)
      .populate('authorId', 'name')
      .populate('genres', 'name slug')
      .lean()
      .exec()) as unknown as RawBookDocument[];

    return {
      data: documents.map((doc) => BookMapper.toDomain(doc)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findAllList(
    filter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookListReadModel>> {
    const queryFilter = this.buildQueryFilter(filter);

    const postFacetStages: PipelineStage.FacetPipelineStage[] = [
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
    ];

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(Math.max(1, pagination.limit || 10), 10000);
    const sortOrder = sort?.order === 'asc' ? 1 : -1;
    const sortStage: Record<string, 1 | -1> = sort?.sortBy
      ? { [sort.sortBy]: sortOrder }
      : { createdAt: -1 };
    const [result] = await this.bookModel
      .aggregate<{
        metadata: Array<{ total: number }>;
        data: RawBookDocument[];
      }>([
        { $match: queryFilter },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $sort: sortStage },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              ...postFacetStages,
            ],
          },
        },
      ])
      .exec();
    const total = result.metadata[0]?.total ?? 0;

    return {
      data: result.data.map((document) => BookMapper.toListReadModel(document)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByGenre(
    genreId: GenreId,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookEntity>> {
    return this.findAll({ genres: [genreId.toString()] }, pagination, sort);
  }

  async findPopular(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<BookEntity>> {
    return this.findAll({}, pagination, { sortBy: 'likes', order: 'desc' });
  }

  async save(book: BookEntity): Promise<void> {
    const persistenceData = BookMapper.toPersistence(book);
    const id = new Types.ObjectId(book.id.toString());

    if (book.isNew) {
      const session = this.sessionContext.currentSession;
      await this.bookModel.create(
        [{ ...persistenceData, _id: id, version: 0 }],
        { session },
      );
      if (!session) book.markPersisted(0);
      return;
    }

    if (!book.isDirty) return;

    const nextVersion = book.loadedVersion + 1;
    const filter: FilterQuery<BookDocument> = {
      _id: id,
      version: book.loadedVersion,
    };
    if (book.loadedVersion === 0) {
      filter.$or = [{ version: 0 }, { version: { $exists: false } }];
    }

    const query = this.bookModel.updateOne(filter, {
      $set: { ...persistenceData, version: nextVersion },
    });
    if (this.sessionContext.currentSession) {
      query.session(this.sessionContext.currentSession);
    }
    const result = await query.exec();

    if (result.matchedCount === 0) {
      throw new ConcurrencyException('Book changed after it was loaded');
    }

    if (!this.sessionContext.currentSession) {
      book.markPersisted(nextVersion);
    }
  }

  async delete(id: BookId, expectedVersion: number): Promise<void> {
    const filter: FilterQuery<BookDocument> = {
      _id: new Types.ObjectId(id.toString()),
      version: expectedVersion,
    };
    if (expectedVersion === 0) {
      filter.$or = [{ version: 0 }, { version: { $exists: false } }];
    }

    const query = this.bookModel.deleteOne(filter);
    if (this.sessionContext.currentSession) {
      query.session(this.sessionContext.currentSession);
    }
    const result = await query.exec();
    if (result.deletedCount === 0) {
      throw new ConcurrencyException('Book changed before it was deleted');
    }
  }

  async softDelete(id: BookId, expectedVersion: number): Promise<void> {
    const filter: FilterQuery<BookDocument> = {
      _id: new Types.ObjectId(id.toString()),
      version: expectedVersion,
    };
    if (expectedVersion === 0) {
      filter.$or = [{ version: 0 }, { version: { $exists: false } }];
    }

    const query = this.bookModel.updateOne(filter, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: expectedVersion + 1,
      },
    });
    if (this.sessionContext.currentSession) {
      query.session(this.sessionContext.currentSession);
    }
    const result = await query.exec();
    if (result.matchedCount === 0) {
      throw new ConcurrencyException('Book changed before it was deleted');
    }
  }

  async existsByTitle(title: BookTitle, excludeId?: BookId): Promise<boolean> {
    const query: FilterQuery<BookDocument> = {
      title: title.toString(),
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId.toString() };
    }

    const count = await this.bookModel.countDocuments(query).exec();
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.bookModel
      .countDocuments({ _id: id, isDeleted: false })
      .exec();
    return count > 0;
  }

  async incrementViews(id: BookId): Promise<void> {
    await this.bookModel
      .findByIdAndUpdate(id.toString(), {
        $inc: { views: 1, version: 1 },
        updatedAt: new Date(),
      })
      .exec();
  }

  async addLike(id: BookId, userId: string): Promise<void> {
    await this.bookModel
      .findByIdAndUpdate(id.toString(), {
        $inc: { likes: 1, version: 1 },
        $addToSet: { likedBy: userId },
        updatedAt: new Date(),
      })
      .exec();
  }

  async removeLike(id: BookId, userId: string): Promise<void> {
    await this.bookModel
      .findByIdAndUpdate(id.toString(), {
        $inc: { likes: -1, version: 1 },
        $pull: { likedBy: userId },
        updatedAt: new Date(),
      })
      .exec();
  }

  async countByGenre(genreId: string): Promise<number> {
    return await this.bookModel
      .countDocuments({
        genres: { $in: [genreId] },
        isDeleted: false,
      })
      .exec();
  }

  // Statistics
  async countTotal(): Promise<number> {
    return await this.bookModel.countDocuments({ isDeleted: false }).exec();
  }

  async countByGenreName(): Promise<
    Array<{ id: string; name: string; slug: string; count: number }>
  > {
    const result = await this.bookModel
      .aggregate<{
        _id: Types.ObjectId;
        name: string;
        slug: string;
        count: number;
      }>([
        { $match: { isDeleted: false } },
        { $unwind: '$genres' },
        {
          $lookup: {
            from: 'genres',
            localField: 'genres',
            foreignField: '_id',
            as: 'genreInfo',
          },
        },
        { $unwind: '$genreInfo' },
        {
          $group: {
            _id: '$genreInfo._id',
            name: { $first: '$genreInfo.name' },
            slug: { $first: '$genreInfo.slug' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .exec();

    return result.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      slug: item.slug,
      count: item.count,
    }));
  }

  async countByTags(): Promise<Array<{ name: string; count: number }>> {
    const result = await this.bookModel
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            isDeleted: false,
            tags: { $exists: true, $not: { $size: 0 } },
          },
        },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .exec();

    return result.map((item) => ({
      name: item._id,
      count: item.count,
    }));
  }

  async findByIds(ids: BookId[]): Promise<BookEntity[]> {
    const objectIds = ids.map((id) => id.toString());
    const documents = (await this.bookModel
      .find({
        _id: { $in: objectIds },
        isDeleted: false,
      })
      .populate('authorId', 'name avatar')
      .populate('genres', 'name slug')
      .lean()
      .exec()) as unknown as RawBookDocument[];

    return documents.map((doc) => BookMapper.toDomain(doc));
  }

  async findIdsByFilter(filter: BookFilter): Promise<string[]> {
    const queryFilter = this.buildQueryFilter(filter);
    const documents = await this.bookModel
      .find(queryFilter, { _id: 1 })
      .lean()
      .exec();

    return documents.map((doc) => doc._id.toString());
  }

  async findSearchCandidates(
    filter: BookFilter,
    limit: number,
  ): Promise<BookSearchCandidate[]> {
    const queryFilter = this.buildQueryFilter(filter);
    const documents = (await this.bookModel
      .find(queryFilter)
      .select('_id title authorId description')
      .limit(limit)
      .populate('authorId', 'name')
      .lean()
      .exec()) as unknown as Array<{
      _id: Types.ObjectId;
      title: string;
      authorId: { name: string } | null;
      description?: string;
    }>;

    return documents.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      authorName: doc.authorId?.name,
      description: doc.description,
    }));
  }

  async getFilters(): Promise<BookFilters> {
    const [genresResult, tagsResult] = await Promise.all([
      this.bookModel
        .aggregate<{ id: string; name: string; slug: string; count: number }>([
          { $match: { isDeleted: false, status: 'published' } },
          { $unwind: '$genres' },
          {
            $lookup: {
              from: 'genres',
              localField: 'genres',
              foreignField: '_id',
              as: 'genreInfo',
            },
          },
          { $unwind: '$genreInfo' },
          {
            $group: {
              _id: '$genreInfo._id',
              name: { $first: '$genreInfo.name' },
              slug: { $first: '$genreInfo.slug' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 20 },
          {
            $project: {
              _id: 0,
              id: '$_id',
              name: 1,
              slug: 1,
              count: 1,
            },
          },
        ])
        .exec(),
      this.bookModel
        .aggregate<{ name: string; count: number }>([
          { $match: { isDeleted: false, status: 'published' } },
          { $unwind: '$tags' },
          {
            $group: {
              _id: '$tags',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 20 },
          {
            $project: {
              _id: 0,
              name: '$_id',
              count: 1,
            },
          },
        ])
        .exec(),
    ]);

    return {
      genres: genresResult.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        count: g.count,
      })),
      tags: tagsResult,
    };
  }
}
