import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';

export interface RateLimitConfig {
  guestLimit: number;
  userLimit: number;
  ttl: number;
  blockDuration: number;
}

export interface UpdateRateLimitPayload {
  guestLimit?: number;
  userLimit?: number;
  ttl?: number;
  blockDuration?: number;
}

export const rateLimitApi = createApi({
  reducerPath: 'rateLimitApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['RateLimit'],
  endpoints: (builder) => ({
    getGeminiRateLimit: builder.query<RateLimitConfig, void>({
      query: () => ({
        url: '/admin/rate-limits/gemini',
        method: 'GET',
      }),
      transformResponse: (response: { data: RateLimitConfig }) => response.data,
      providesTags: ['RateLimit'],
    }),

    updateGeminiRateLimit: builder.mutation<RateLimitConfig, UpdateRateLimitPayload>({
      query: (payload) => ({
        url: '/admin/rate-limits/gemini',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['RateLimit'],
    }),
  }),
});

export const {
  useGetGeminiRateLimitQuery,
  useUpdateGeminiRateLimitMutation,
} = rateLimitApi;
