import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_RECOMMENDATIONS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { GetRecommendationsRequest, RecommendationsResponse } from '../types/recommendation.interface';

export const recommendationsApi = createApi({
  reducerPath: 'recommendationsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Recommendations'],
  endpoints: (builder) => ({
    getPersonalizedRecommendations: builder.query<
      RecommendationsResponse,
      GetRecommendationsRequest
    >({
      query: (params) => ({
        url: NESTJS_RECOMMENDATIONS_ENDPOINTS.getPersonalized,
        method: 'GET',
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
        },
      }),
      providesTags: ['Recommendations'],
    }),
  }),
});

export const { useGetPersonalizedRecommendationsQuery } = recommendationsApi;
