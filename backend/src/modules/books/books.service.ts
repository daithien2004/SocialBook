import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { Chapter, ChapterDocument } from '../chapters/schemas/chapter.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Author, AuthorDocument } from '../authors/schemas/author.schema';
import { Genre, GenreDocument } from '../genres/schemas/genre.schema';
import { slugify } from '@/src/utils/slugify';
import { CreateBookDto } from './dto/create-book.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  // PRIVATE HELPER: Lấy chi tiết book với chapters, reviews, ratings
  private async findBookWithDetails(book: any) {
    // Lấy chapters
    const chapters = await this.chapterModel
      .find({ bookId: book._id })
      .sort({ orderIndex: 1 })
      .lean();

    // Lấy reviews với populate user
    const reviews = await this.reviewModel
      .find({ bookId: book._id })
      .populate({
        path: 'userId',
        select: 'username image',
      })
      .sort({ createdAt: -1 })
      .lean();

    // TÍNH AVERAGE RATING & TOTAL RATINGS từ reviews
    const ratingStats = await this.reviewModel.aggregate([
      {
        $match: {
          bookId: new Types.ObjectId(book._id as Types.ObjectId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const ratingData = ratingStats[0] || {};
    const averageRating = ratingData.averageRating
      ? Math.round(ratingData.averageRating * 10) / 10
      : 0;
    const totalRatings = ratingData.totalRatings || 0;

    // RETURN
    return {
      id: book._id,
      title: book.title,
      slug: book.slug,
      description: book.description,
      coverUrl: book.coverUrl,
      status: book.status,
      tags: book.tags,
      views: book.views,
      likes: book.likes,
      publishedYear: book.publishedYear,
      authorId: book.authorId,
      genres: book.genre,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      chapters,
      reviews,
      averageRating,
      totalRatings,
      ratingDistribution: await this.getRatingDistribution(
        book._id as Types.ObjectId,
      ),
    };
  }

  async findBySlug(slug: string) {
    // VALIDATION
    if (!slug) {
      throw new BadRequestException('Book slug is required');
    }

    // EXECUTION
    const book = await this.bookModel
      .findOne({ slug: slug, isDeleted: false })
      .populate('authorId', 'name avatar')
      .populate('genre', 'name slug')
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with slug "${slug}" not found`);
    }

    return this.findBookWithDetails(book);
  }

  async findById(id: string) {
    // VALIDATION
    if (!id) {
      throw new BadRequestException('Book ID is required');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid book ID format');
    }

    // EXECUTION
    const book = await this.bookModel
      .findOne({ _id: id, isDeleted: false })
      .populate('authorId', 'name avatar')
      .populate('genre', 'name slug')
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }

    return this.findBookWithDetails(book);
  }

  async getBooks() {
    // EXECUTION
    const books = await this.bookModel
      .find({ isDeleted: false })
      .populate('authorId', 'name')
      .populate('genre', 'name slug')
      .select(
        'title slug description coverUrl status tags views likes publishedYear createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .lean();

    // RETURN
    return {
      total: books.length,
      books: books.map((book) => ({
        id: book._id,
        title: book.title,
        slug: book.slug,
        description: book.description,
        coverUrl: book.coverUrl,
        status: book.status,
        tags: book.tags,
        views: book.views,
        likes: book.likes,
        publishedYear: book.publishedYear,
        authorId: book.authorId,
        genres: book.genre,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      })),
    };
  }

  // thống kê của các rating (1-5 sao) từ reviews
  private async getRatingDistribution(bookId: Types.ObjectId) {
    const distribution = await this.reviewModel.aggregate([
      {
        $match: {
          bookId: bookId,
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Chuyển đổi thành object {1: count, 2: count, ...}
    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((item) => {
      result[item._id] = item.count;
    });

    return result;
  }

  // Thêm method mới để lấy thống kê review chi tiết
  async getReviewStats(bookId: Types.ObjectId) {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          bookId: bookId,
        },
      },
      {
        $group: {
          _id: '$bookId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          verifiedPurchases: {
            $sum: { $cond: ['$verifiedPurchase', 1, 0] },
          },
          totalLikes: { $sum: '$likesCount' },
        },
      },
    ]);

    return (
      stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        verifiedPurchases: 0,
        totalLikes: 0,
      }
    );
  }

  async createBook(dto: CreateBookDto, coverFile?: Express.Multer.File) {
    // 1. VALIDATION
    if (!dto.title?.trim()) {
      throw new BadRequestException('Book title is required');
    }

    if (!dto.authorId || !Types.ObjectId.isValid(dto.authorId)) {
      throw new BadRequestException('Valid authorId is required');
    }

    if (!Array.isArray(dto.genre) || dto.genre.length === 0) {
      throw new BadRequestException('At least one genre is required');
    }

    const invalidGenreId = dto.genre.find((id) => !Types.ObjectId.isValid(id));
    if (invalidGenreId) {
      throw new BadRequestException(`Invalid genre ID: ${invalidGenreId}`);
    }

    // Kiểm tra author tồn tại
    const author = await this.authorModel.findById(dto.authorId);
    if (!author) {
      throw new BadRequestException(`Author with ID ${dto.authorId} not found`);
    }

    // Kiểm tra tất cả genre tồn tại
    const genres = await this.genreModel.find({
      _id: { $in: dto.genre.map((id) => new Types.ObjectId(id)) },
    });

    if (genres.length !== dto.genre.length) {
      const existingIds = genres.map((g) => g._id);
      const missing = dto.genre.filter((id) => !existingIds.includes(id));
      throw new BadRequestException(`Genres not found: ${missing.join(', ')}`);
    }

    // 2. XỬ LÝ ẢNH BÌA
    let coverUrl: string | null = null;

    if (coverFile) {
      coverUrl = await this.cloudinaryService.uploadImage(coverFile);
    }

    // 3. TẠO SLUG ĐẸP – DÙNG HÀM slugify TỰ VIẾT CỦA BẠN (xử lý tiếng Việt cực đỉnh)
    const baseSlug = dto.slug?.trim() || slugify(dto.title.trim());
    const finalSlug = await this.generateUniqueSlug(baseSlug);

    // 4. TẠO BOOK
    const newBook = await this.bookModel.create({
      title: dto.title.trim(),
      slug: finalSlug,
      authorId: dto.authorId,
      genre: dto.genre,
      description: dto.description?.trim() || '',
      coverUrl,
      publishedYear: dto.publishedYear,
      status: dto.status || 'draft',
      tags: dto.tags || [],
      views: 0,
      likes: 0,
    });

    // 5. POPULATE & TRẢ VỀ
    const populatedBook = await this.bookModel
      .findById(newBook._id)
      .populate('authorId', 'name avatar')
      .populate('genre', 'name slug')
      .lean()
      .exec();

    if (!populatedBook) {
      throw new InternalServerErrorException(
        'Failed to create book after saving',
      );
    }

    return {
      id: populatedBook._id.toString(),
      title: populatedBook.title,
      slug: populatedBook.slug,
      description: populatedBook.description,
      coverUrl: populatedBook.coverUrl,
      status: populatedBook.status,
      tags: populatedBook.tags,
      views: populatedBook.views,
      likes: populatedBook.likes,
      publishedYear: populatedBook.publishedYear,
      author: populatedBook.authorId,
      genres: populatedBook.genre,
      createdAt: populatedBook.createdAt,
      updatedAt: populatedBook.updatedAt,
    };
  }

  // Helper: Đảm bảo slug là duy nhất (ví dụ: truyen-ngan → truyen-ngan-2)
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.bookModel.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // src/modules/books/books.service.ts
  async getAllBook(filters: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    genre?: string;
    author?: string;
  }) {
    const { page, limit, status, search, genre, author } = filters;
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre) query.genre = genre;
    if (author) query.authorId = author;

    const [books, total] = await Promise.all([
      this.bookModel
        .find(query)
        .populate('authorId', 'name avatar')
        .populate('genre', 'name slug')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      this.bookModel.countDocuments(query),
    ]);

    const booksWithStats = await Promise.all(
      books.map(async (book) => {
        const chapterCount = await this.chapterModel.countDocuments({
          bookId: book._id,
        });

        return {
          id: book._id,
          title: book.title,
          slug: book.slug,
          description: book.description,
          coverUrl: book.coverUrl,
          status: book.status,
          tags: book.tags,
          views: book.views,
          likes: book.likes,
          publishedYear: book.publishedYear,
          authorId: book.authorId,
          genre: book.genre,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
          isDeleted: book.isDeleted,
          stats: {
            chapters: chapterCount,
            views: book.views || 0,
            likes: book.likes?.toString() || 0,
          },
        };
      }),
    );

    return {
      books: booksWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBook(
    id: string,
    dto: CreateBookDto,
    coverFile?: Express.Multer.File,
  ) {
    // 1. VALIDATION
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid book ID');
    }

    const existingBook = await this.bookModel.findById(id);
    if (!existingBook) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    if (dto.title?.trim()) {
      // Check if title is being changed and if new title already exists
      if (dto.title.trim() !== existingBook.title) {
        const baseSlug = dto.slug?.trim() || slugify(dto.title.trim());
        const existingWithSlug = await this.bookModel.findOne({
          slug: baseSlug,
          _id: { $ne: id },
        });
        if (existingWithSlug) {
          throw new ConflictException('A book with this title already exists');
        }
      }
    }

    if (dto.authorId && !Types.ObjectId.isValid(dto.authorId)) {
      throw new BadRequestException('Valid authorId is required');
    }

    if (dto.authorId) {
      const author = await this.authorModel.findById(dto.authorId);
      if (!author) {
        throw new BadRequestException(
          `Author with ID ${dto.authorId} not found`,
        );
      }
    }

    if (dto.genre && Array.isArray(dto.genre)) {
      const invalidGenreId = dto.genre.find(
        (genreId) => !Types.ObjectId.isValid(genreId),
      );
      if (invalidGenreId) {
        throw new BadRequestException(`Invalid genre ID: ${invalidGenreId}`);
      }

      const genres = await this.genreModel.find({
        _id: { $in: dto.genre.map((genreId) => new Types.ObjectId(genreId)) },
      });

      if (genres.length !== dto.genre.length) {
        const existingIds = genres.map((g) => g._id);
        const missing = dto.genre.filter(
          (genreId) => !existingIds.includes(genreId),
        );
        throw new BadRequestException(
          `Genres not found: ${missing.join(', ')}`,
        );
      }
    }

    // 2. XỬ LÝ ẢNH BÌA MỚI (nếu có)
    let coverUrl = existingBook.coverUrl;

    if (coverFile) {
      // Xóa ảnh cũ trên Cloudinary nếu có
      if (existingBook.coverUrl) {
        try {
          await this.cloudinaryService.deleteImage(existingBook.coverUrl);
        } catch (error) {
          console.warn('Failed to delete old cover image:', error);
        }
      }

      // Upload ảnh mới
      coverUrl = await this.cloudinaryService.uploadImage(coverFile);
    }

    // 3. CẬP NHẬT SLUG NẾU TITLE THAY ĐỔI
    let finalSlug = existingBook.slug;
    if (dto.title?.trim() && dto.title.trim() !== existingBook.title) {
      const baseSlug = dto.slug?.trim() || slugify(dto.title.trim());
      finalSlug = await this.generateUniqueSlug(baseSlug);
    }

    // 4. CẬP NHẬT BOOK
    const updateData: any = {};

    if (dto.title?.trim()) updateData.title = dto.title.trim();
    if (finalSlug !== existingBook.slug) updateData.slug = finalSlug;
    if (dto.authorId) updateData.authorId = dto.authorId;
    if (dto.genre) updateData.genre = dto.genre;
    if (dto.description !== undefined)
      updateData.description = dto.description.trim();
    if (coverUrl !== existingBook.coverUrl) updateData.coverUrl = coverUrl;
    if (dto.publishedYear) updateData.publishedYear = dto.publishedYear;
    if (dto.status) updateData.status = dto.status;
    if (dto.tags) updateData.tags = dto.tags;

    const updatedBook = await this.bookModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('authorId', 'name avatar')
      .populate('genre', 'name slug')
      .lean()
      .exec();

    if (!updatedBook) {
      throw new InternalServerErrorException('Failed to update book');
    }

    return {
      id: updatedBook._id.toString(),
      title: updatedBook.title,
      slug: updatedBook.slug,
      description: updatedBook.description,
      coverUrl: updatedBook.coverUrl,
      status: updatedBook.status,
      tags: updatedBook.tags,
      views: updatedBook.views,
      likes: updatedBook.likes,
      publishedYear: updatedBook.publishedYear,
      author: updatedBook.authorId,
      genres: updatedBook.genre,
      createdAt: updatedBook.createdAt,
      updatedAt: updatedBook.updatedAt,
    };
  }

  async deleteBook(id: string) {
    // 1. VALIDATION
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid book ID');
    }

    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    if (book.isDeleted) {
      throw new BadRequestException('Book is already deleted');
    }

    // 2. XÓA ẢNH BÌA TRÊN CLOUDINARY (nếu có)
    if (book.coverUrl) {
      try {
        await this.cloudinaryService.deleteImage(book.coverUrl);
      } catch (error) {
        console.warn('Failed to delete cover image:', error);
      }
    }

    // 3. XÓA SÁCH (soft delete hoặc hard delete)
    // Soft delete: đánh dấu isDeleted = true
    await this.bookModel.findByIdAndUpdate(id, { isDeleted: true });

    return { success: true };
  }
}
