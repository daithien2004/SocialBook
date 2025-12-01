// src/modules/recommendations/recommendations.service.ts
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

interface UserProfile {
  completedBooks: any[];
  currentlyReading: any[];
  highRatedBooks: any[];
  recentActivity: any[];
  favoriteGenres: string[];
  totalReadingTime: number;
}

interface AIRecommendation {
  bookId: string;
  title: string;
  reason: string;
  matchScore: number;
}

export interface RecommendationResponse {
  analysis: {
    favoriteGenres: string[];
    readingPace: 'fast' | 'medium' | 'slow';
    preferredLength: 'short' | 'medium' | 'long';
    themes: string[];
  };
  recommendations: AIRecommendation[];
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
    limit: number = 10,
  ): Promise<RecommendationResponse> {
    try {
      const userProfile = await this.buildUserProfile(userId);

      // Step 2: Get all available books (exclude already read)
      const availableBooks = await this.getAvailableBooks(userId);

      // Step 3: Generate AI recommendations
      const aiRecommendations = await this.generateAIRecommendations(
        userProfile,
        availableBooks,
        limit,
      );

      return aiRecommendations;
    } catch (error) {
      this.logger.error(`Recommendation error for user ${userId}:`, error);
      throw error;
    }
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
        .lean(),

      this.progressModel
        .find({ userId: userObjectId })
        .sort({ lastReadAt: -1 })
        .limit(20)
        .populate({
          path: 'bookId',
          populate: { path: 'genres' },
        })
        .lean(),

      this.reviewModel
        .find({ userId: userObjectId })
        .populate({
          path: 'bookId',
          populate: { path: 'genres' },
        })
        .lean(),

      this.bookModel.find({ likedBy: userObjectId }).populate('genres').lean(),
    ]);

    const completedBooks = readingLists
      .filter((rl) => rl.status === 'COMPLETED')
      .map((rl) => ({
        book: rl.bookId,
      }));

    const currentlyReading = readingLists
      .filter((rl) => rl.status === 'READING')
      .map((rl) => ({
        book: rl.bookId,
        progress: this.calculateBookProgress(
          rl.bookId._id.toString(),
          progresses,
        ),
      }));

    const highRatedBooks = reviews
      .filter((r) => r.rating >= 4)
      .map((r) => ({
        book: r.bookId,
        rating: r.rating,
        review: r.content,
      }));

    const recentActivity = progresses.slice(0, 10).map((p) => ({
      book: p.bookId,
      timeSpent: p.timeSpent,
      lastRead: p.lastReadAt,
    }));

    const genreCounts = new Map<string, number>();
    const allBooks = [
      ...completedBooks.map((cb) => cb.book),
      ...currentlyReading.map((cr) => cr.book),
      ...highRatedBooks.map((hr) => hr.book),
      ...likedBooks,
    ];

    allBooks.forEach((book: any) => {
      if (book?.genres) {
        book.genres.forEach((genre: any) => {
          const genreName = genre.name || genre.toString();
          genreCounts.set(genreName, (genreCounts.get(genreName) || 0) + 1);
        });
      }
    });

    const favoriteGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);

    const totalReadingTime = progresses.reduce(
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

  private calculateBookProgress(bookId: string, progresses: any[]): number {
    const bookProgresses = progresses.filter(
      (p) => p.bookId._id.toString() === bookId,
    );

    if (bookProgresses.length === 0) return 0;

    const completedChapters = bookProgresses.filter(
      (p) => p.status === 'completed',
    ).length;

    return completedChapters;
  }

  private async getAvailableBooks(userId: string): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);

    const readingLists = await this.readingListModel
      .find({ userId: userObjectId })
      .select('bookId')
      .lean();

    const readBookIds = readingLists.map((rl) => rl.bookId);

    const availableBooks = await this.bookModel
      .find({
        _id: { $nin: readBookIds },
        status: 'published',
        isDeleted: false,
      })
      .populate('genres authorId')
      .limit(100)
      .lean();

    return availableBooks;
  }

  private async generateAIRecommendations(
    userProfile: UserProfile,
    availableBooks: any[],
    limit: number,
  ): Promise<RecommendationResponse> {
    const completedBooksText = userProfile.completedBooks
      .slice(0, 10)
      .map((cb: any) => {
        const book = cb.book;
        return `- ${book.title} (${book.genres?.map((g: any) => g.name).join(', ')})`;
      })
      .join('\n');

    const currentlyReadingText = userProfile.currentlyReading
      .map((cr: any) => {
        const book = cr.book;
        return `- ${book.title} (Đã đọc ${cr.progress} chương)`;
      })
      .join('\n');

    const highRatedBooksText = userProfile.highRatedBooks
      .slice(0, 5)
      .map((hr: any) => {
        const book = hr.book;
        return `- ${book.title}: ${hr.rating}⭐ - "${hr.review}"`;
      })
      .join('\n');

    const availableBooksText = availableBooks.slice(0, 50).map((book: any) => {
      return {
        id: book._id.toString(),
        title: book.title,
        genres: book.genres?.map((g: any) => g.name).join(', '),
        description: book.description?.substring(0, 200),
        views: book.views,
        likes: book.likes,
      };
    });

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
      const result =
        await this.geminiService.generateJSON<RecommendationResponse>(prompt);

      // Validate recommendations
      result.recommendations = result.recommendations.filter((rec) =>
        availableBooks.some((book) => book._id.toString() === rec.bookId),
      );

      return result;
    } catch (error) {
      this.logger.error('AI recommendation generation failed:', error);
      // Fallback to simple recommendation
      return this.getFallbackRecommendations(
        userProfile,
        availableBooks,
        limit,
      );
    }
  }

  /**
   * Fallback recommendations if AI fails
   */
  private getFallbackRecommendations(
    userProfile: UserProfile,
    availableBooks: any[],
    limit: number,
  ): RecommendationResponse {
    // Simple genre-based matching
    const recommendations = availableBooks
      .filter((book) => {
        const bookGenres = book.genres?.map((g: any) => g.name) || [];
        return bookGenres.some((g: string) =>
          userProfile.favoriteGenres.includes(g),
        );
      })
      .sort((a, b) => b.views + b.likes - (a.views + a.likes))
      .slice(0, limit)
      .map((book) => ({
        bookId: book._id.toString(),
        title: book.title,
        reason: `Cùng thể loại với sách bạn đã thích`,
        matchScore: 70,
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
