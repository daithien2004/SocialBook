import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GeminiService } from '../gemini/gemini.service';
import { Book, BookDocument } from '../books/schemas/book.schema';
import {
  ReadingList,
  ReadingListDocument,
} from '../library/schemas/reading-list.schema';
import {
  Progress,
  ProgressDocument,
} from '../progress/schemas/progress.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Like, LikeDocument } from '../likes/schemas/like.schema';
import { GenreDocument } from '../genres/schemas/genre.schema';
import { AuthorDocument } from '../authors/schemas/author.schema';

type PopulatedBook = Omit<BookDocument, 'genres' | 'authorId'> & {
  genres?: GenreDocument[];
  authorId?: AuthorDocument;
};

type PopulatedReadingList = Omit<ReadingListDocument, 'bookId'> & {
  bookId: PopulatedBook;
};

type PopulatedProgress = Omit<ProgressDocument, 'bookId'> & {
  bookId: PopulatedBook;
};

type PopulatedReview = Omit<ReviewDocument, 'bookId'> & {
  bookId: PopulatedBook;
};

interface CompletedBook {
  book: PopulatedBook;
}

interface CurrentlyReadingBook {
  book: PopulatedBook;
  progress: number;
}

interface HighRatedBook {
  book: PopulatedBook;
  rating: number;
  review: string;
}

interface RecentActivity {
  book: PopulatedBook;
  timeSpent?: number;
  lastRead: Date;
}

interface UserProfile {
  completedBooks: CompletedBook[];
  currentlyReading: CurrentlyReadingBook[];
  highRatedBooks: HighRatedBook[];
  recentActivity: RecentActivity[];
  favoriteGenres: string[];
  totalReadingTime: number;
}

interface AvailableBookSummary {
  id: string;
  title: string;
  genres: string;
  description: string;
  views: number;
  likes: number;
}

export interface AIAnalysis {
  favoriteGenres: string[];
  readingPace: 'fast' | 'medium' | 'slow';
  preferredLength: 'short' | 'medium' | 'long';
  themes: string[];
}

interface AIRecommendation {
  bookId: string;
  title: string;
  reason: string;
  matchScore: number;
}

interface AIResponse {
  analysis: AIAnalysis;
  recommendations: AIRecommendation[];
}

export interface EnrichedRecommendation extends AIRecommendation {
  slug: string;
  book: PopulatedBook;
}

export interface RecommendationResponse {
  analysis: AIAnalysis;
  recommendations: EnrichedRecommendation[];
}

export interface PaginatedRecommendationResponse {
  analysis: AIAnalysis;
  recommendations: EnrichedRecommendation[];
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    private geminiService: GeminiService,
  ) {}

  async getPersonalizedRecommendations(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedRecommendationResponse> {
    const userProfile = await this.buildUserProfile(userId);
    const availableBooks = await this.getAvailableBooks(userId);

    const totalRecommendationsToGenerate = 50;
    const aiRecommendations = await this.generateAIRecommendations(
      userProfile,
      availableBooks,
      totalRecommendationsToGenerate,
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecommendations = aiRecommendations.recommendations.slice(
      startIndex,
      endIndex,
    );

    const totalItems = aiRecommendations.recommendations.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      analysis: aiRecommendations.analysis,
      recommendations: paginatedRecommendations,
      currentPage: page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    const userObjectId = new Types.ObjectId(userId);

    const [readingLists, progresses, reviews, likedBooks] = await Promise.all([
      this.readingListModel
        .find({ userId: userObjectId })
        .populate({
          path: 'bookId',
          populate: { path: 'genres authorId' },
        })
        .lean<PopulatedReadingList[]>(),

      this.progressModel
        .find({ userId: userObjectId })
        .sort({ lastReadAt: -1 })
        .limit(20)
        .populate({
          path: 'bookId',
          populate: { path: 'genres' },
        })
        .lean<PopulatedProgress[]>(),

      this.reviewModel
        .find({ userId: userObjectId })
        .populate({
          path: 'bookId',
          populate: { path: 'genres' },
        })
        .lean<PopulatedReview[]>(),

      this.bookModel
        .find({ likedBy: userObjectId })
        .populate('genres')
        .lean<PopulatedBook[]>(),
    ]);

    const validReadingLists = readingLists.filter((rl) => rl.bookId != null);
    const validProgresses = progresses.filter((p) => p.bookId != null);
    const validReviews = reviews.filter((r) => r.bookId != null);

    const completedBooks: CompletedBook[] = validReadingLists
      .filter((rl) => rl.status === 'COMPLETED')
      .map((rl) => ({
        book: rl.bookId,
      }));

    const currentlyReading: CurrentlyReadingBook[] = validReadingLists
      .filter((rl) => rl.status === 'READING')
      .map((rl) => ({
        book: rl.bookId,
        progress: this.calculateBookProgress(
          rl.bookId._id.toString(),
          validProgresses,
        ),
      }));

    const highRatedBooks: HighRatedBook[] = validReviews
      .filter((r) => r.rating >= 4)
      .map((r) => ({
        book: r.bookId,
        rating: r.rating,
        review: r.content,
      }));

    const recentActivity: RecentActivity[] = validProgresses
      .slice(0, 10)
      .map((p) => ({
        book: p.bookId,
        timeSpent: p.timeSpent,
        lastRead: p.lastReadAt,
      }));

    const genreCounts = new Map<string, number>();
    const allBooks: PopulatedBook[] = [
      ...completedBooks.map((cb) => cb.book),
      ...currentlyReading.map((cr) => cr.book),
      ...highRatedBooks.map((hr) => hr.book),
      ...likedBooks,
    ].filter((book): book is PopulatedBook => book != null);

    allBooks.forEach((book) => {
      if (book?.genres) {
        book.genres.forEach((genre) => {
          if (genre && genre.name) {
            genreCounts.set(genre.name, (genreCounts.get(genre.name) || 0) + 1);
          }
        });
      }
    });

    const favoriteGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);

    const totalReadingTime = validProgresses.reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0,
    );

    return {
      completedBooks,
      currentlyReading,
      highRatedBooks,
      recentActivity,
      favoriteGenres,
      totalReadingTime,
    };
  }

  private calculateBookProgress(
    bookId: string,
    progresses: PopulatedProgress[],
  ): number {
    const bookProgresses = progresses.filter(
      (p) => p.bookId && p.bookId._id && p.bookId._id.toString() === bookId,
    );

    if (bookProgresses.length === 0) return 0;

    const completedChapters = bookProgresses.filter(
      (p) => p.status === 'completed',
    ).length;

    return completedChapters;
  }

  private async getAvailableBooks(userId: string): Promise<PopulatedBook[]> {
    const userObjectId = new Types.ObjectId(userId);

    const readingLists = await this.readingListModel
      .find({ userId: userObjectId })
      .select('bookId')
      .lean<Pick<ReadingListDocument, 'bookId'>[]>();

    const readBookIds = readingLists
      .filter((rl) => rl.bookId != null)
      .map((rl) => rl.bookId);

    const availableBooks = await this.bookModel
      .find({
        _id: { $nin: readBookIds },
        status: 'published',
        isDeleted: false,
      })
      .populate('genres authorId')
      .limit(100)
      .lean<PopulatedBook[]>();

    return availableBooks;
  }

  private async generateAIRecommendations(
    userProfile: UserProfile,
    availableBooks: PopulatedBook[],
    limit: number,
  ): Promise<RecommendationResponse> {
    const completedBooksText = userProfile.completedBooks
      .slice(0, 10)
      .map((cb) => {
        const book = cb.book;
        if (!book) return null;
        return `- ${book.title} (${book.genres?.map((g) => g.name).join(', ') || 'N/A'})`;
      })
      .filter((text): text is string => text !== null)
      .join('\n');

    const currentlyReadingText = userProfile.currentlyReading
      .map((cr) => {
        const book = cr.book;
        if (!book) return null;
        return `- ${book.title} (Đã đọc ${cr.progress} chương)`;
      })
      .filter((text): text is string => text !== null)
      .join('\n');

    const highRatedBooksText = userProfile.highRatedBooks
      .slice(0, 5)
      .map((hr) => {
        const book = hr.book;
        if (!book) return null;
        return `- ${book.title}: ${hr.rating}⭐ - "${hr.review}"`;
      })
      .filter((text): text is string => text !== null)
      .join('\n');

    const availableBooksText: AvailableBookSummary[] = availableBooks
      .slice(0, 50)
      .map((book) => ({
        id: book._id.toString(),
        title: book.title,
        genres: book.genres?.map((g) => g.name).join(', ') || 'N/A',
        description: book.description?.substring(0, 200) || 'No description',
        views: book.views || 0,
        likes: book.likes || 0,
      }));

    const prompt = `
Bạn là một chuyên gia đề xuất sách thông minh. Phân tích sở thích đọc sách của người dùng và đề xuất sách phù hợp.

📚 LỊCH SỬ ĐỌC SÁCH:

Đã hoàn thành (${userProfile.completedBooks.length} cuốn):
${completedBooksText || 'Chưa có sách nào'}

Đang đọc (${userProfile.currentlyReading.length} cuốn):
${currentlyReadingText || 'Chưa có sách nào'}

Đánh giá cao (4-5 sao):
${highRatedBooksText || 'Chưa có review nào'}

Thể loại yêu thích: ${userProfile.favoriteGenres.join(', ') || 'Chưa xác định'}
Tổng thời gian đọc: ${Math.round(userProfile.totalReadingTime / 3600)} giờ

📖 SÁCH CÓ SẴN TRONG HỆ THỐNG:
${JSON.stringify(availableBooksText, null, 2)}

🎯 NHIỆM VỤ:
1. Phân tích patterns trong sở thích của user:
   - Thể loại ưa thích nhất
   - Tốc độ đọc (fast/medium/slow dựa vào thời gian)
   - Độ dài sách ưa thích (short/medium/long)
   - Themes/chủ đề thường xuyên xuất hiện

2. Từ danh sách sách có sẵn, chọn ${limit} cuốn PHÙ HỢP NHẤT với user
   - Ưu tiên sách có genres trùng với favorite genres
   - Cân nhắc popularity (views, likes) nhưng không phải yếu tố duy nhất
   - Đảm bảo đa dạng (không đề xuất toàn bộ cùng 1 thể loại)
   - Giải thích CỤ THỂ tại sao mỗi cuốn phù hợp

3. Tính matchScore (0-100) cho mỗi đề xuất dựa trên:
   - Genre match: 40%
   - User history patterns: 30%
   - Popularity: 20%
   - Diversity bonus: 10%

⚠️ LƯU Ý:
- CHỈ đề xuất sách từ danh sách "SÁCH CÓ SẴN" (dùng đúng bookId)
- KHÔNG bịa ra sách không có trong danh sách
- Mỗi lý do phải CỤ THỂ, liên hệ đến lịch sử user

📋 TRẢ VỀ JSON FORMAT (STRICT):
{
  "analysis": {
    "favoriteGenres": ["thể loại 1", "thể loại 2"],
    "readingPace": "fast" | "medium" | "slow",
    "preferredLength": "short" | "medium" | "long",
    "themes": ["theme 1", "theme 2"]
  },
  "recommendations": [
    {
      "bookId": "id từ danh sách available books",
      "title": "tên sách",
      "reason": "Lý do cụ thể tại sao phù hợp với user này",
      "matchScore": 85
    }
  ]
}

CHỈ TRẢ VỀ JSON, KHÔNG THÊM TEXT NÀO KHÁC.
`;

    try {
      const result = await this.geminiService.generateJSON<AIResponse>(prompt);

      const bookMap = new Map<string, PopulatedBook>(
        availableBooks.map((book) => [book._id.toString(), book]),
      );

      const enrichedRecommendations: EnrichedRecommendation[] =
        result.recommendations
          .filter((rec) => bookMap.has(rec.bookId))
          .map((rec) => {
            const book = bookMap.get(rec.bookId)!;

            return {
              bookId: rec.bookId,
              title: rec.title,
              reason: rec.reason,
              matchScore: rec.matchScore,
              slug: book.slug,
              book: book,
            };
          });

      return {
        analysis: result.analysis,
        recommendations: enrichedRecommendations,
      };
    } catch (error) {
      this.logger.error('AI recommendation generation failed:', error);
      return this.getFallbackRecommendations(
        userProfile,
        availableBooks,
        limit,
      );
    }
  }

  private getFallbackRecommendations(
    userProfile: UserProfile,
    availableBooks: PopulatedBook[],
    limit: number,
  ): RecommendationResponse {
    const recommendations: EnrichedRecommendation[] = availableBooks
      .filter((book) => {
        const bookGenres = book.genres?.map((g) => g.name) || [];
        return bookGenres.some((g) => userProfile.favoriteGenres.includes(g));
      })
      .sort(
        (a, b) =>
          (b.views || 0) + (b.likes || 0) - ((a.views || 0) + (a.likes || 0)),
      )
      .slice(0, limit)
      .map((book) => ({
        bookId: book._id.toString(),
        title: book.title,
        reason: `Cùng thể loại với sách bạn đã thích`,
        matchScore: 70,
        slug: book.slug,
        book: book,
      }));

    return {
      analysis: {
        favoriteGenres: userProfile.favoriteGenres,
        readingPace: 'medium',
        preferredLength: 'medium',
        themes: [],
      },
      recommendations,
    };
  }
}
