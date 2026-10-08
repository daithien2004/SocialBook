import { Query } from '@nestjs/cqrs';
import type { PaginatedRecommendationResult } from '@/modules/recommendations/domain/interfaces/recommendation-result';

export class GetPersonalizedRecommendationsQuery extends Query<PaginatedRecommendationResult> {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
  ) {
    super();
  }
}
