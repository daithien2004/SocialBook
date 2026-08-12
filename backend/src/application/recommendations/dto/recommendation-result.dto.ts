import {
  EnrichedRecommendation,
  RecommendationAnalysis,
} from '@/domain/recommendations/interfaces/recommendation.interface';

export interface RecommendationResult {
  analysis: RecommendationAnalysis;
  recommendations: EnrichedRecommendation[];
}

export interface PaginatedRecommendationResult {
  analysis: RecommendationAnalysis;
  recommendations: EnrichedRecommendation[];
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
