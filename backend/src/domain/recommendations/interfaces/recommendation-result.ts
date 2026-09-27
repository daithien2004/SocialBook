import { PaginationMeta } from '@/shared/domain/pagination.types';
import {
  EnrichedRecommendation,
  RecommendationAnalysis,
} from './recommendation.interface';

export interface RecommendationResult {
  analysis: RecommendationAnalysis;
  recommendations: EnrichedRecommendation[];
}

export interface PaginatedRecommendationResult extends RecommendationResult {
  meta: PaginationMeta;
}
