import { RecommendationResult } from './recommendation-result';

export abstract class IRecommendationCachePort {
  abstract get(userId: string): Promise<RecommendationResult | null>;
  /** Cache writes are best-effort; implementations must log failures. */
  abstract set(userId: string, data: RecommendationResult): Promise<void>;
  /** Cache invalidation is best-effort; implementations must log failures. */
  abstract clear(userId: string): Promise<void>;
}
