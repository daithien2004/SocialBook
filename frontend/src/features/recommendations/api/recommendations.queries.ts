import { recommendationsKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';
import { getPersonalizedRecommendations } from './recommendations.api';
import type {
  GetRecommendationsRequest,
  RecommendationsResponse,
} from '../types/recommendation.interface';

export const recommendationsQueries = {
  personalized: (params?: GetRecommendationsRequest) => ({
    queryKey: recommendationsKeys.personalized(params),
    queryFn: (): Promise<RecommendationsResponse> => getPersonalizedRecommendations(params),
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
};