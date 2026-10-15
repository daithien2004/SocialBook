import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import type { Actor } from '@/shared/casl/actor';
import { GetPersonalizedRecommendationsQuery } from '../../application/queries/get-personalized-recommendations/get-personalized-recommendations.query';

export class GetRecommendationsDto extends PaginationQueryDto {
  toQuery(actor: Actor): GetPersonalizedRecommendationsQuery {
    return new GetPersonalizedRecommendationsQuery(
      actor,
      this.actualPage,
      this.actualLimit,
    );
  }
}
