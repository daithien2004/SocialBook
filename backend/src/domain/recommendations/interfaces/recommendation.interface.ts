import { PopulatedBook } from './recommendation-data.repository.interface';

export interface EnrichedRecommendation {
  bookId: string;
  title: string;
  reason: string;
  matchScore: number;
  slug: string;
  book: PopulatedBook;
}

export interface RecommendationAnalysis {
  favoriteGenres: string[];
  readingPace: 'fast' | 'medium' | 'slow';
  preferredLength: 'short' | 'medium' | 'long';
  themes: string[];
}
