import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_ANALYTICS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { ReadingHeatmapData, ChapterEngagementData, ReadingSpeedData, GeographicData, ActiveUsersData } from '../types/admin.interface';

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Analytics', 'ActiveUsers'],
  endpoints: (builder) => ({
    getReadingHeatmap: builder.query<ReadingHeatmapData[], void>({
      query: () => ({
        url: NESTJS_ANALYTICS_ENDPOINTS.getReadingHeatmap,
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    getChapterEngagement: builder.query<
      ChapterEngagementData[],
      { limit?: number }
    >({
      query: ({ limit = 10 }) => ({
        url: NESTJS_ANALYTICS_ENDPOINTS.getChapterEngagement,
        method: 'GET',
        params: { limit },
      }),
      providesTags: ['Analytics'],
    }),

    getReadingSpeed: builder.query<ReadingSpeedData[], { days?: number }>({
      query: ({ days = 30 }) => ({
        url: NESTJS_ANALYTICS_ENDPOINTS.getReadingSpeed,
        method: 'GET',
        params: { days },
      }),
      providesTags: ['Analytics'],
    }),

    getGeographicDistribution: builder.query<GeographicData[], void>({
      query: () => ({
        url: NESTJS_ANALYTICS_ENDPOINTS.getGeographicDistribution,
        method: 'GET',
      }),
      providesTags: ['Analytics'],
    }),

    getActiveUsers: builder.query<ActiveUsersData, void>({
      query: () => ({
        url: NESTJS_ANALYTICS_ENDPOINTS.getActiveUsers,
        method: 'GET',
      }),
      providesTags: ['ActiveUsers'],
    }),

    seedReadingHistory: builder.mutation<any, { days?: number }>({
      query: ({ days = 30 }) => ({
        url: NESTJS_ANALYTICS_ENDPOINTS.seedReadingHistory,
        method: 'POST',
        params: { days },
      }),
      invalidatesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetReadingHeatmapQuery,
  useGetChapterEngagementQuery,
  useGetReadingSpeedQuery,
  useGetGeographicDistributionQuery,
  useGetActiveUsersQuery,
  useSeedReadingHistoryMutation,
} = analyticsApi;

