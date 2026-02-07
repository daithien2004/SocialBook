import { RecommendationResponse } from './recommendation.interface';

export interface UserProfile {
    completedBooks: any[];
    currentlyReading: any[];
    highRatedBooks: any[];
    recentActivity: any[];
    favoriteGenres: string[];
    totalReadingTime: number;
}

export interface IRecommendationStrategy {
    generate(
        userId: string,
        userProfile: UserProfile,
        availableBooks: any[],
        limit: number
    ): Promise<RecommendationResponse>;
}
