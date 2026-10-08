import { RecommendationResult } from './recommendation-result';

export abstract class IRecommendationCachePort {
  abstract get(userId: string): Promise<RecommendationResult | null>;
  abstract set(userId: string, data: RecommendationResult): Promise<void>;
  abstract clear(userId: string): Promise<void>;
}
