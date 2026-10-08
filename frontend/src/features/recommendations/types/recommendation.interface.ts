import { PaginationMetaData } from '@/lib/pagination.schema';
import { Book } from '../../books/types/book.interface';

export interface RecommendationAnalysis {
  favoriteGenres: string[];
  readingPace: 'fast' | 'medium' | 'slow';
  preferredLength: 'short' | 'medium' | 'long';
  themes: string[];
}

export interface BookRecommendation {
  bookId: string;
  title: string;
  slug: string;
  reason: string;
  matchScore: number;
  book: Book;
}

export interface RecommendationsResponse {
  data: BookRecommendation[];
  analysis: RecommendationAnalysis;
  meta: PaginationMetaData;
}

export interface GetRecommendationsRequest {
  page?: number;
  limit?: number;
}
