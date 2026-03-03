import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '@/infrastructure/database/schemas/book.schema';
import { Genre, GenreDocument } from '@/infrastructure/database/schemas/genre.schema';
import { IRecommendationStrategy, UserProfile } from '@/domain/recommendations/interfaces/recommendation-strategy.interface';
import { RecommendationResponse, RecommendationResult } from '@/domain/recommendations/interfaces/recommendation.interface';

@Injectable()
export class FallbackRecommendationStrategy implements IRecommendationStrategy {
    constructor(
        @InjectModel(Book.name) private bookModel: Model<BookDocument>,
        @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
    ) {}

    async generate(
        userId: string,
        userProfile: UserProfile,
        availableBooks: any[], // PopulatedBook[]
        limit: number
    ): Promise<RecommendationResponse> {
        let recommendations: RecommendationResult[] = [];
        const favoriteGenreNames = userProfile.favoriteGenres || [];

        // 1. Content-based filtering using genres
        if (favoriteGenreNames.length > 0) {
            const genres = await this.genreModel.find({ name: { $in: favoriteGenreNames } }).lean();
            const genreIds = genres.map(g => g._id);

            if (genreIds.length > 0) {
                const matchedBooks = await this.bookModel.find({
                    genres: { $in: genreIds },
                    status: 'published',
                    isDeleted: false,
                    _id: { $in: availableBooks.map(b => b._id) } // Ensure only available books
                })
                .sort({ views: -1, likes: -1 })
                .limit(limit)
                .populate('genres authorId')
                .lean<any[]>();

                recommendations = matchedBooks.map((book) => ({
                    bookId: book._id.toString(),
                    title: book.title,
                    reason: `Phù hợp với sở thích: ${book.genres?.find((g: any) => favoriteGenreNames.includes(g.name))?.name || 'Thể loại yêu thích'}`,
                    matchScore: 80,
                    slug: book.slug,
                    book: book,
                }));
            }
        }

        // 2. Popularity-based fallback
        if (recommendations.length < limit) {
            const existingIds = new Set(recommendations.map(r => r.bookId));
            
            // Sort available books by popularity
            const additional = availableBooks
                .filter(b => !existingIds.has(b._id.toString()))
                .sort((a, b) => (b.views || 0) + (b.likes || 0) - ((a.views || 0) + (a.likes || 0)))
                .slice(0, limit - recommendations.length)
                .map((book) => ({
                    bookId: book._id.toString(),
                    title: book.title,
                    reason: `Sách phổ biến được nhiều người đọc`,
                    matchScore: 60,
                    slug: book.slug,
                    book: book,
                }));

            recommendations = [...recommendations, ...additional];
        }

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

