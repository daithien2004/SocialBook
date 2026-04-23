import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/common/interfaces/pagination.interface';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { BookListReadModel } from '@/domain/books/read-models/book-list.read-model';
import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { BookFilter } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../../schemas/book.schema';
import { Genre, GenreDocument } from '../../schemas/genre.schema';
import { BookMapper } from './book.mapper';
import { RawBookDocument } from './book.raw-types';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { SearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { ContentType } from '@/domain/chroma/value-objects/content-type.vo';

@Injectable()
export class BookQueryProvider implements IBookQueryProvider {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(Genre.name) private readonly genreModel: Model<GenreDocument>,
    private readonly vectorRepository: IVectorRepository,
  ) {}

  private buildQueryFilter(filter: BookFilter): FilterQuery<BookDocument> {
    const queryFilter: FilterQuery<BookDocument> = { isDeleted: false };

    if (filter.title)
      queryFilter.title = { $regex: filter.title, $options: 'i' };
    if (filter.authorId) queryFilter.authorId = filter.authorId;
    if (filter.genres && filter.genres.length > 0)
      queryFilter.genres = { $in: filter.genres };
    if (filter.tags && filter.tags.length > 0)
      queryFilter.tags = { $in: filter.tags };
    if (filter.status) queryFilter.status = filter.status;
    if (filter.search) queryFilter.$text = { $search: filter.search };
    if (filter.publishedYear) queryFilter.publishedYear = filter.publishedYear;
    if (filter.ids && filter.ids.length > 0) {
      queryFilter._id = { $in: filter.ids.map((id) => new Types.ObjectId(id)) };
    }

    return queryFilter;
  }

  async findAllList(
    filter: BookFilter,
    pagination: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<BookListReadModel>> {
    if (filter.genres && filter.genres.length > 0) {
      const slugsToResolve = filter.genres.filter(
        (id) => !Types.ObjectId.isValid(id),
      );
      const validIds = filter.genres.filter((id) => Types.ObjectId.isValid(id));

      if (slugsToResolve.length > 0) {
        const genres = await this.genreModel
          .find({ slug: { $in: slugsToResolve } })
          .select('_id')
          .lean()
          .exec();
        validIds.push(...genres.map((g) => g._id.toString()));
      }
      filter.genres = validIds;
    }

    // 1. Handle Vector Search Integration
    let orderedIds: string[] = [];
    let isVectorSearch = false;

    if (filter.search && filter.search.trim().length > 0) {
      try {
        const searchQuery = SearchQuery.create({
          id: new Types.ObjectId().toString(),
          query: filter.search,
          embedding: [],
          contentType: 'book',
          limit: pagination.limit * 2, // Get more for filtering
          threshold: 0.1, // Very low threshold to let the booster do its job
        });

        const vectorResults = await this.vectorRepository.search(searchQuery);
        if (vectorResults.length > 0) {
          orderedIds = vectorResults.map(r => r.document.contentId);
          isVectorSearch = true;
          // Clear standard search to avoid MongoDB text search interference
          delete filter.search;
          // Add IDs to filter
          filter.ids = orderedIds;
        }
      } catch (error) {
        console.error('Vector search integration failed:', error);
        // Fallback to standard search
      }
    }

    const queryFilter = this.buildQueryFilter(filter);
    const skip = (pagination.page - 1) * pagination.limit;

    // Build sort stage
    let sortStage: any;
    if (isVectorSearch && orderedIds.length > 0) {
      // Custom sort to maintain Chroma order
      sortStage = {
        $addFields: {
          __searchOrder: { $indexOfArray: [orderedIds, { $toString: '$_id' }] }
        }
      };
    } else {
      sortStage = sort?.sortBy
        ? { $sort: { [sort.sortBy]: sort.order === 'desc' ? -1 : 1 } }
        : { $sort: { createdAt: -1 } };
    }

    const pipeline: any[] = [{ $match: queryFilter }];

    // If vector search, add the order field and sort by it
    if (isVectorSearch) {
      pipeline.push(sortStage);
      pipeline.push({ $sort: { __searchOrder: 1 } });
    } else if (sortStage.$sort) {
      pipeline.push(sortStage);
    }

    const [result] = await this.bookModel
      .aggregate([
        ...pipeline,
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
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
              {
                $project: {
                  _id: 1,
                  title: 1,
                  slug: 1,
                  coverUrl: 1,
                  status: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  views: 1,
                  likes: 1,
                  __v: 1,
                  genres: { _id: 1, name: 1, slug: 1 },
                  authorId: 1,
                  chapterCount: 1,
                  tags: 1,
                  likedBy: 1,
                  publishedYear: 1,
                },
              },
            ],
          },
        },
      ])
      .exec();

    const total = result.metadata[0]?.total || 0;
    const documents = result.data;

    return {
      data: documents.map((doc: RawBookDocument) =>
        BookMapper.toListReadModel(doc),
      ),
      meta: {
        current: pagination.page,
        pageSize: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findDetailBySlug(slug: string): Promise<BookDetailReadModel | null> {
    const results = await this.bookModel
      .aggregate([
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
        {
          $project: {
            _id: 1,
            title: 1,
            slug: 1,
            description: 1,
            publishedYear: 1,
            coverUrl: 1,
            status: 1,
            tags: 1,
            likedBy: 1,
            views: 1,
            likes: 1,
            createdAt: 1,
            updatedAt: 1,
            authorId: 1,
            'genreDetails._id': 1,
            'genreDetails.name': 1,
            'genreDetails.slug': 1,
            'chapters._id': 1,
            'chapters.title': 1,
            'chapters.slug': 1,
            'chapters.orderIndex': 1,
            'chapters.viewsCount': 1,
            'chapters.createdAt': 1,
            'chapters.updatedAt': 1,
          },
        },
      ])
      .exec();

    if (!results || results.length === 0) return null;

    return BookMapper.toDetailReadModel(results[0]);
  }

  async getGrowthMetrics(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<Array<{ _id: string; count: number }>> {
    let dateFormat: string;
    switch (groupBy) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
        break;
    }

    return await this.bookModel
      .aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
  }

  async searchByText(
    query: string,
    limit: number = 10,
  ): Promise<Array<{ id: BookId; score: number }>> {
    const results: Array<{ id: BookId; score: number }> = [];
    if (!query || query.trim().length === 0) return results;

    try {
      const books = await this.bookModel
        .find(
          {
            $text: { $search: query },
            status: 'published',
            isDeleted: false,
          },
          { score: { $meta: 'textScore' } }, // Projection for sorting score
        )
        .sort({ score: { $meta: 'textScore' } }) // Sort by MongoDB text match score
        .limit(limit)
        .select('_id')
        .lean()
        .exec();

      for (const book of books) {
        results.push({
          id: BookId.create(book._id.toString()),
          score: (book as any).score, // The textScore returned by projection
        });
      }
    } catch (error: any) {
      console.error(`Text search error: ${error.message}`);
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
