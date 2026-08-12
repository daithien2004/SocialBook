import { RecommendationResult } from '@/application/recommendations/dto/recommendation-result.dto';

export abstract class IRecommendationCachePort {
  abstract get(userId: string): Promise<RecommendationResult | null>;
  abstract set(userId: string, data: RecommendationResult): Promise<void>;
  abstract clear(userId: string): Promise<void>;
}
