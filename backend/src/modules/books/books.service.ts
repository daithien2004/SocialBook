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
import { uploadBufferToCloudinary } from '@/src/shared/cloudinary/cloudinary.utils';
import cloudinary from '@/src/shared/cloudinary/cloudinary.provider';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) { }

  async findBySlug(slug: string) {
    // VALIDATION
    if (!slug) {
      throw new BadRequestException('Book slug is required');
    }

    // EXECUTION
    const book = await this.bookModel
      .findOne({ slug: slug })
      .populate('authorId', 'username email')
      .populate('genre', 'name slug')
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with slug "${slug}" not found`);
    }

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
      author: book.authorId,
      genres: book.genre,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      chapters,
      reviews, // Đổi từ comments sang reviews
      averageRating,
      totalRatings,
      ratingDistribution: await this.getRatingDistribution(
        book._id as Types.ObjectId,
      ),
    };
  }

  async getBooks() {
    // EXECUTION
    const books = await this.bookModel
      .find({ isDeleted: false })
      .populate('authorId', 'username email')
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
        author: book.authorId,
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

  async createBook(dto: CreateBookDto) {
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

    const invalidGenreId = dto.genre.find(id => !Types.ObjectId.isValid(id));
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
      _id: { $in: dto.genre.map(id => new Types.ObjectId(id)) },
    });

    if (genres.length !== dto.genre.length) {
      const existingIds = genres.map(g => g._id); 
      const missing = dto.genre.filter(id => !existingIds.includes(id));
      throw new BadRequestException(`Genres not found: ${missing.join(', ')}`);
    }

    // 2. XỬ LÝ ẢNH BÌA
    let coverUrl: string | null = null;

    if (dto.coverUrl?.startsWith('data:image/')) {
      console.log('[BooksService] Uploading book cover to Cloudinary...');
      coverUrl = await this.uploadBase64ToCloudinary(dto.coverUrl, dto.title);
      console.log('[BooksService] Upload success:', coverUrl);
    } else if (dto.coverUrl?.startsWith('http')) {
      coverUrl = dto.coverUrl;
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
      throw new InternalServerErrorException('Failed to create book after saving');
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

  // Helper riêng để upload ảnh – dễ test, dễ reuse
  private async uploadBase64ToCloudinary(
    base64String: string,
    bookTitle: string,
  ): Promise<string> {
    const safeTitle = bookTitle?.trim() || 'untitled-book';
    const slug = slugify(safeTitle); // ← Hàm bạn tự viết, xử lý tiếng Việt cực tốt
    const publicId = `${slug}-${Date.now()}`;

    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'socialbook/books',
      public_id: publicId,
      format: 'webp',
      quality: 'auto:best',
    });

    return result.secure_url;
  }
}
