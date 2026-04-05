import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_ANALYTICS_ENDPOINTS, NESTJS_STATISTICS_ENDPOINTS } from '@/constants/server-endpoints';
import { ReadingHeatmapData, ChapterEngagementData, ReadingSpeedData, GeographicData, ActiveUsersData } from '../types/admin.interface';
import { OverviewStats, BookStats, GrowthMetric } from '../types/dashboard.types';

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Analytics', 'ActiveUsers', 'Statistics'],
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

    seedReadingHistory: builder.mutation<void, { days?: number }>({
      query: ({ days = 30 }) => ({
        url: NESTJS_ANALYTICS_ENDPOINTS.seedReadingHistory,
        method: 'POST',
        params: { days },
      }),
      invalidatesTags: ['Analytics'],
    }),

    getOverviewStats: builder.query<OverviewStats, void>({
      query: () => ({
        url: NESTJS_STATISTICS_ENDPOINTS.overview,
        method: 'GET',
      }),
      providesTags: ['Statistics'],
    }),

    getGrowthStats: builder.query<GrowthMetric[], { days: number; groupBy?: string }>({
      query: ({ days, groupBy = 'day' }) => ({
        url: `${NESTJS_STATISTICS_ENDPOINTS.growth(days)}&groupBy=${groupBy}`,
        method: 'GET',
      }),
      providesTags: ['Statistics'],
    }),

    getBookStats: builder.query<BookStats, void>({
      query: () => ({
        url: NESTJS_STATISTICS_ENDPOINTS.books,
        method: 'GET',
      }),
      providesTags: ['Statistics'],
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
  useGetOverviewStatsQuery,
  useGetGrowthStatsQuery,
  useGetBookStatsQuery,
} = analyticsApi;

