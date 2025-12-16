// recommendation.interface.ts
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

export interface PaginationMeta {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RecommendationsResponse {
  recommendations: BookRecommendation[];
  pagination: PaginationMeta;
  analysis: RecommendationAnalysis;
}

export interface GetRecommendationsRequest {
  page?: number;
  limit?: number;
}
