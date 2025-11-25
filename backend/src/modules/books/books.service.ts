import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

// Schemas
import { Book, BookDocument } from './schemas/book.schema';
import { Chapter, ChapterDocument } from '../chapters/schemas/chapter.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Author, AuthorDocument } from '../authors/schemas/author.schema';
import { Genre, GenreDocument } from '../genres/schemas/genre.schema';

// Utils & DTOs
import { slugify } from '@/src/utils/slugify';
import { CreateBookDto } from './dto/create-book.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  ReadingList,
  ReadingListDocument,
} from '@/src/modules/library/schemas/reading-list.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
    @InjectModel(ReadingList.name) private readingListModel: Model<ReadingListDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async findAll(query: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    genres?: string;
    author?: string;
  }) {
    const { page, limit, status, search, genres, author } = query;
    const skip = (page - 1) * limit;

    // Build Query
    const filter: FilterQuery<BookDocument> = { isDeleted: false };

    if (status) filter.status = status;
    if (genres) filter.genres = new Types.ObjectId(genres);
    if (author) filter.authorId = new Types.ObjectId(author);
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Parallel Execution: Get Data & Count
    const [books, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .populate('authorId', 'name avatar')
        .populate('genres', 'name slug')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookModel.countDocuments(filter),
    ]);

    const booksWithStats = await Promise.all(
      books.map(async (book) => {
        const chapterCount = await this.chapterModel.countDocuments({
          bookId: book._id,
        });
        return {
          ...book,
          stats: {
            chapters: chapterCount,
            views: book.views || 0,
            likes: book.likes || 0,
          },
        };
      }),
    );

    return {
      data: booksWithStats,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const book = await this.bookModel
      .findOne({ slug, isDeleted: false })
      .populate('authorId', 'name avatar')
      .populate('genres', 'name slug')
      .lean();

    if (!book) throw new NotFoundException(`Book not found`);

    this.bookModel.updateOne({ _id: book._id }, { $inc: { views: 1 } }).exec();
    book.views = (book.views || 0) + 1;

    return this.enrichBookDetails(book, userId);
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid ID');

    const book = await this.bookModel
      .findOne({ _id: id, isDeleted: false })
      .populate('authorId', 'name avatar')
      .populate('genres', 'name slug')
      .lean();

    if (!book) throw new NotFoundException(`Book not found`);

    return this.enrichBookDetails(book);
  }

  async create(dto: CreateBookDto, coverFile?: Express.Multer.File) {
    // 1. Validate Author & Genres
    await this.validateReferences(dto.authorId, dto.genres);

    // 2. Upload Image
    const coverUrl = coverFile
      ? await this.cloudinaryService.uploadImage(coverFile)
      : null;

    // 3. Generate Slug
    const baseSlug = dto.slug?.trim() || slugify(dto.title);
    const uniqueSlug = await this.generateUniqueSlug(baseSlug);

    // 4. Create Book
    const newBook = await this.bookModel.create({
      ...dto,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      slug: uniqueSlug,
      coverUrl,
      views: 0,
      likes: 0,
      likedBy: [],
    });

    return await this.bookModel
      .findById(newBook._id)
      .populate('authorId', 'name avatar')
      .populate('genres', 'name slug');
  }

  async update(
    id: string,
    dto: CreateBookDto,
    coverFile?: Express.Multer.File,
  ) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid ID');

    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');

    // 1. Validate References if changed
    if (dto.authorId || dto.genres) {
      await this.validateReferences(
        dto.authorId || book.authorId.toString(),
        dto.genres || (book.genres as any),
      );
    }

    // 2. Handle Slug Update
    let slug = book.slug;
    if (dto.title && dto.title !== book.title) {
      const baseSlug = dto.slug?.trim() || slugify(dto.title);
      slug = await this.generateUniqueSlug(baseSlug, id);
    }

    // 3. Handle Cover Update
    let coverUrl = book.coverUrl;
    if (coverFile) {
      if (book.coverUrl)
        await this.cloudinaryService.deleteImage(book.coverUrl);
      coverUrl = await this.cloudinaryService.uploadImage(coverFile);
    }

    // 4. Update
    const updatedBook = await this.bookModel
      .findByIdAndUpdate(id, { ...dto, slug, coverUrl }, { new: true })
      .populate('authorId', 'name avatar')
      .populate('genres', 'name slug');

    return updatedBook;
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid ID');

    const book = await this.bookModel.findById(id);
    if (!book || book.isDeleted) throw new NotFoundException('Book not found');

    await this.bookModel.findByIdAndUpdate(id, { isDeleted: true });

    return { message: 'Book deleted successfully' };
  }

  async toggleLike(slug: string, userId: string) {
    const book = await this.bookModel.findOne({ slug, isDeleted: false });
    if (!book) throw new NotFoundException('Book not found');

    const uid = new Types.ObjectId(userId);
    const isLiked = book.likedBy?.some((id) => id.equals(uid));

    const update = isLiked
      ? { $pull: { likedBy: uid }, $inc: { likes: -1 } }
      : { $addToSet: { likedBy: uid }, $inc: { likes: 1 } };

    const updatedBook = await this.bookModel
      .findByIdAndUpdate(book._id, update, { new: true })
      .select('slug likes likedBy');

    return {
      slug: updatedBook?.slug,
      likes: updatedBook?.likes,
      isLiked: !isLiked,
    };
  }

  private async enrichBookDetails(book: any, userId?: string) {
    const bookId = book._id;

    const [chapters, reviews, ratingStats, distribution] = await Promise.all([
      this.chapterModel.find({ bookId }).sort({ orderIndex: 1 }).lean(),
      this.reviewModel
        .find({ bookId })
        .populate('userId', 'username image')
        .sort({ createdAt: -1 })
        .lean(),
      this.getReviewAggregates(bookId),
      this.getRatingDistribution(bookId),
    ]);

    const isLiked =
      userId && book.likedBy
        ? book.likedBy.some((id) => id.toString() === userId)
        : false;

    return {
      ...book,
      isLiked,
      chapters,
      reviews,
      stats: {
        averageRating: ratingStats.averageRating,
        totalRatings: ratingStats.totalRatings,
        ratingDistribution: distribution,
      },
    };
  }

  private async validateReferences(
    authorId: Types.ObjectId,
    genresId: Types.ObjectId[],
  ) {
    if (authorId && !Types.ObjectId.isValid(authorId))
      throw new BadRequestException('Invalid Author ID');

    if (genresId && genresId.some((id) => !Types.ObjectId.isValid(id)))
      throw new BadRequestException('Invalid Genre ID');

    const [author, countGenres] = await Promise.all([
      this.authorModel.findById(authorId),
      this.genreModel.countDocuments({ _id: { $in: genresId } }),
    ]);

    if (!author) throw new BadRequestException('Author not found');
    if (countGenres !== genresId.length)
      throw new BadRequestException('One or more genres not found');
  }

  private async generateUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query: any = { slug };
      if (excludeId) query._id = { $ne: excludeId };

      const exists = await this.bookModel.exists(query);
      if (!exists) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  private async getReviewAggregates(bookId: Types.ObjectId) {
    const stats = await this.reviewModel.aggregate([
      { $match: { bookId: new Types.ObjectId(bookId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const data = stats[0] || {};
    return {
      averageRating: data.averageRating
        ? Math.round(data.averageRating * 10) / 10
        : 0,
      totalRatings: data.totalRatings || 0,
    };
  }

  private async getRatingDistribution(bookId: Types.ObjectId) {
    const distribution = await this.reviewModel.aggregate([
      { $match: { bookId: new Types.ObjectId(bookId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((item) => (result[item._id] = item.count));
    return result;
  }

  async getBookStats(id: string) {
    if (!id) {
      throw new BadRequestException('Book ID is required');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid book ID format');
    }

    const book = await this.bookModel
      .findOne({ _id: id, isDeleted: false })
      .select('views likes')
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }

    const chaptersCount = await this.chapterModel.countDocuments({
      bookId: new Types.ObjectId(id),
    });

    return {
      id,
      views: book.views || 0,
      likes: book.likes || 0,
      chapters: chaptersCount || 0,
    };
  }
}
