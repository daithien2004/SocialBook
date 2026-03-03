import { Injectable, Logger, Inject } from '@nestjs/common';
import { GeminiService } from '../../external/gemini.service';
import { INFRASTRUCTURE_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import { IRecommendationStrategy, UserProfile } from '@/domain/recommendations/interfaces/recommendation-strategy.interface';
import { RecommendationResponse, RecommendationResult } from '@/domain/recommendations/interfaces/recommendation.interface';
import { FallbackRecommendationStrategy } from './fallback-recommendation.strategy';

interface AIAnalysis {
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

@Injectable()
export class AIRecommendationStrategy implements IRecommendationStrategy {
    private readonly logger = new Logger(AIRecommendationStrategy.name);

    constructor(
        @Inject(INFRASTRUCTURE_TOKENS.GEMINI_SERVICE)
        private geminiService: GeminiService,
        private fallbackStrategy: FallbackRecommendationStrategy
    ) {}

    async generate(
        userId: string,
        userProfile: UserProfile,
        availableBooks: any[],
        limit: number
    ): Promise<RecommendationResponse> {
        try {
            const completedBooksText = userProfile.completedBooks
                .slice(0, 10)
                .map((cb) => {
                    const book = cb.book;
                    if (!book) return null;
                    return `- ${book.title} (${book.genres?.map((g: any) => g.name).join(', ') || 'N/A'})`;
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

            const availableBooksText = availableBooks
                .slice(0, 50)
                .map((book) => ({
                    id: book._id.toString(),
                    title: book.title,
                    genres: book.genres?.map((g: any) => g.name).join(', ') || 'N/A',
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

            const result = await this.geminiService.generateJSON<AIResponse>(prompt);

            const bookMap = new Map<string, any>(
                availableBooks.map((book) => [book._id.toString(), book]),
            );

            const recommendations: RecommendationResult[] = result.recommendations
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
                recommendations,
            };

        } catch (error) {
            this.logger.error('AI recommendation generation failed:', error);
            return this.fallbackStrategy.generate(userId, userProfile, availableBooks, limit);
        }
    }
}

