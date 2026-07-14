import { RecommendationResponse } from './recommendation.interface';
import { PopulatedBook } from './recommendation-data.port';

export interface CompletedBookEntry {
  book: PopulatedBook;
}

export interface CurrentlyReadingEntry {
  book: PopulatedBook;
  progress: number;
}

export interface HighRatedBookEntry {
  book: PopulatedBook;
  rating: number;
  review: string;
}

export interface RecentActivityEntry {
  book: PopulatedBook;
  timeSpent: number;
  lastRead: Date;
}

export interface UserProfile {
  completedBooks: CompletedBookEntry[];
  currentlyReading: CurrentlyReadingEntry[];
  highRatedBooks: HighRatedBookEntry[];
  recentActivity: RecentActivityEntry[];
  favoriteGenres: string[];
  totalReadingTime: number;
}

export interface IRecommendationStrategy {
  generate(
    userId: string,
    userProfile: UserProfile,
    availableBooks: PopulatedBook[],
    limit: number,
  ): Promise<RecommendationResponse>;
}
