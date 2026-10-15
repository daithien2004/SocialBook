import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { RecommendationsReadModel } from '../../read-models/recommendations.read-model';

export class GetPersonalizedRecommendationsQuery extends Query<RecommendationsReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly page: number,
    public readonly limit: number,
  ) {
    super();
  }
}
