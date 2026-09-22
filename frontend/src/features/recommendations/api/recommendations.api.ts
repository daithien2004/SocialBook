import { NESTJS_RECOMMENDATIONS_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/nestjs-client-api';
import {
  GetRecommendationsRequest,
  RecommendationsResponse,
} from '../types/recommendation.interface';

export type {
  GetRecommendationsRequest,
  RecommendationsResponse,
} from '../types/recommendation.interface';

export async function getPersonalizedRecommendations(
  params?: GetRecommendationsRequest,
): Promise<RecommendationsResponse> {
  return apiRequest<RecommendationsResponse>({
    url: NESTJS_RECOMMENDATIONS_ENDPOINTS.getPersonalized,
    method: 'GET',
    params: {
      page: params?.page || 1,
      limit: params?.limit || 10,
    },
  });
}