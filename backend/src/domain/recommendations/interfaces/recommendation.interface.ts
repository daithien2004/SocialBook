export interface EnrichedRecommendation {
  bookId: string;
  title: string;
  reason: string;
  matchScore: number;
  slug: string;
  book: any; // PopulatedBook
}

export interface RecommendationResult extends EnrichedRecommendation {}

export interface RecommendationAnalysis {
  favoriteGenres: string[];
  readingPace: 'fast' | 'medium' | 'slow';
  preferredLength: 'short' | 'medium' | 'long';
  themes: string[];
}

export interface RecommendationResponse {
  analysis: RecommendationAnalysis;
  recommendations: EnrichedRecommendation[];
}

export interface PaginatedRecommendationResponse {
    analysis: RecommendationAnalysis;
    recommendations: EnrichedRecommendation[];
    currentPage: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
