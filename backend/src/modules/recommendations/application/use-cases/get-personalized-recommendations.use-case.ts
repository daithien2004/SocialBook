import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '@/src/modules/books/infrastructure/schemas/book.schema';
import { ReadingList, ReadingListDocument } from '@/src/modules/library/infrastructure/schemas/reading-list.schema';
import { Progress, ProgressDocument } from '@/src/modules/progress/schemas/progress.schema';
import { Review, ReviewDocument } from '@/src/modules/reviews/infrastructure/schemas/review.schema';
import { Like, LikeDocument } from '@/src/modules/likes/infrastructure/schemas/like.schema';
import { Genre, GenreDocument } from '@/src/modules/genres/infrastructure/schemas/genre.schema';
import { UserOnboarding, UserOnboardingDocument } from '@/src/modules/onboarding/infrastructure/schemas/user-onboarding.schema';
import { AIRecommendationStrategy } from '../../infrastructure/strategies/ai-recommendation.strategy';
import { FallbackRecommendationStrategy } from '../../infrastructure/strategies/fallback-recommendation.strategy';
import { UserProfile } from '../../domain/interfaces/recommendation-strategy.interface';
import { RecommendationResponse, EnrichedRecommendation, PaginatedRecommendationResponse } from '../../domain/interfaces/recommendation.interface';

@Injectable()
export class GetPersonalizedRecommendationsUseCase {
    private readonly logger = new Logger(GetPersonalizedRecommendationsUseCase.name);

    constructor(
        @InjectModel(Book.name) private bookModel: Model<BookDocument>,
        @InjectModel(ReadingList.name) private readingListModel: Model<ReadingListDocument>,
        @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
        @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
        @InjectModel(UserOnboarding.name) private userOnboardingModel: Model<UserOnboardingDocument>,
        private aiStrategy: AIRecommendationStrategy,
        private fallbackStrategy: FallbackRecommendationStrategy,
    ) { }

    async execute(
        userId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<PaginatedRecommendationResponse> {
        const userProfile = await this.buildUserProfile(userId);
        const availableBooks = await this.getAvailableBooks(userId);

        const interactionCount = await this.getInteractionCount(userId);
        const MIN_ACTIVITY_FOR_AI = 3;
        const totalRecommendationsToGenerate = 15;

        let recommendationsResponse: RecommendationResponse; // Ensure this matches interface

        if (interactionCount < MIN_ACTIVITY_FOR_AI) {
            this.logger.log(`Low activity for user ${userId} (${interactionCount}). Skipping AI.`);
            recommendationsResponse = await this.fallbackStrategy.generate(
                userId,
                userProfile,
                availableBooks,
                totalRecommendationsToGenerate
            );
        } else {
            this.logger.log(`Sufficient activity for user ${userId} (${interactionCount}). Using AI.`);
            recommendationsResponse = await this.aiStrategy.generate(
                userId,
                userProfile,
                availableBooks,
                totalRecommendationsToGenerate
            );
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRecommendations = recommendationsResponse.recommendations.slice(startIndex, endIndex);

        const totalItems = recommendationsResponse.recommendations.length;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            analysis: recommendationsResponse.analysis,
            recommendations: paginatedRecommendations,
            currentPage: page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    private async getInteractionCount(userId: string): Promise<number> {
        const userObjectId = new Types.ObjectId(userId);
        const [completedCount, reviewCount, likedCount] = await Promise.all([
            this.readingListModel.countDocuments({ userId: userObjectId, status: 'COMPLETED' }),
            this.reviewModel.countDocuments({ userId: userObjectId }),
            this.bookModel.countDocuments({ likedBy: userObjectId }),
        ]);
        return completedCount + reviewCount + likedCount;
    }

    private async buildUserProfile(userId: string): Promise<UserProfile> {
        const userObjectId = new Types.ObjectId(userId);

        const [readingLists, progresses, reviews, likedBooks, userOnboarding] = await Promise.all([
            this.readingListModel.find({ userId: userObjectId })
                .populate({ path: 'bookId', populate: { path: 'genres authorId' } })
                .lean<any[]>(),
            this.progressModel.find({ userId: userObjectId })
                .sort({ lastReadAt: -1 })
                .limit(20)
                .populate({ path: 'bookId', populate: { path: 'genres' } })
                .lean<any[]>(),
            this.reviewModel.find({ userId: userObjectId })
                .populate({ path: 'bookId', populate: { path: 'genres' } })
                .lean<any[]>(),
            this.bookModel.find({ likedBy: userObjectId })
                .populate('genres')
                .lean<any[]>(),
            this.userOnboardingModel.findOne({ userId: userObjectId })
                .populate('favoriteGenres')
                .lean<{ favoriteGenres: any[] }>(),
        ]);

        const validReadingLists = readingLists.filter((rl) => rl.bookId != null);
        const validProgresses = progresses.filter((p) => p.bookId != null);
        const validReviews = reviews.filter((r) => r.bookId != null);

        const completedBooks = validReadingLists
            .filter((rl) => rl.status === 'COMPLETED')
            .map((rl) => ({ book: rl.bookId }));

        const currentlyReading = validReadingLists
            .filter((rl) => rl.status === 'READING')
            .map((rl) => ({
                book: rl.bookId,
                progress: this.calculateBookProgress(rl.bookId._id.toString(), validProgresses),
            }));

        const highRatedBooks = validReviews
            .filter((r) => r.rating >= 4)
            .map((r) => ({
                book: r.bookId,
                rating: r.rating,
                review: r.content,
            }));

        const recentActivity = validProgresses
            .slice(0, 10)
            .map((p) => ({
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
        ].filter((book) => book != null);

        allBooks.forEach((book) => {
            if (book?.genres) {
                book.genres.forEach((genre: any) => {
                    if (genre && genre.name) {
                        genreCounts.set(genre.name, (genreCounts.get(genre.name) || 0) + 1);
                    }
                });
            }
        });

        if (userOnboarding?.favoriteGenres) {
            userOnboarding.favoriteGenres.forEach((genre) => {
                if (genre && genre.name) {
                    genreCounts.set(genre.name, (genreCounts.get(genre.name) || 0) + 3);
                }
            });
        }

        const favoriteGenres = Array.from(genreCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map((entry) => entry[0]);

        const totalReadingTime = validProgresses.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

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
            (p) => p.bookId && p.bookId._id && p.bookId._id.toString() === bookId,
        );
        if (bookProgresses.length === 0) return 0;
        return bookProgresses.filter((p) => p.status === 'completed').length;
    }

    private async getAvailableBooks(userId: string): Promise<any[]> {
        const userObjectId = new Types.ObjectId(userId);
        const readingLists = await this.readingListModel.find({ userId: userObjectId }).select('bookId').lean<any[]>();
        const readBookIds = readingLists.filter((rl) => rl.bookId != null).map((rl) => rl.bookId);

        return await this.bookModel.find({
            _id: { $nin: readBookIds },
            status: 'published',
            isDeleted: false,
        })
            .populate('genres authorId')
            .limit(100)
            .lean<any[]>();
    }
}
