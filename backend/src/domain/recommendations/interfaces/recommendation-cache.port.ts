import { RecommendationResponse } from './recommendation.interface';

export abstract class RecommendationCachePort {
  abstract get(userId: string): Promise<RecommendationResponse | null>;
  abstract set(userId: string, data: RecommendationResponse): Promise<void>;
  abstract clear(userId: string): Promise<void>;
}
