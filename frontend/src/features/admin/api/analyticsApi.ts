import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { ReadingHeatmapData, ChapterEngagementData, ReadingSpeedData, GeographicData, ActiveUsersData } from '../types/admin.interface';

export const analyticsApi = createApi({
    reducerPath: 'analyticsApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Analytics', 'ActiveUsers'],
    endpoints: (builder) => ({
        getReadingHeatmap: builder.query<ReadingHeatmapData[], void>({
            query: () => ({
                url: '/admin/statistics/analytics/reading-heatmap',
                method: 'GET',
            }),
            providesTags: ['Analytics'],
        }),

        getChapterEngagement: builder.query<
            ChapterEngagementData[],
            { limit?: number }
        >({
            query: ({ limit = 10 }) => ({
                url: '/admin/statistics/analytics/chapter-engagement',
                method: 'GET',
                params: { limit },
            }),
            providesTags: ['Analytics'],
        }),

        getReadingSpeed: builder.query<ReadingSpeedData[], { days?: number }>({
            query: ({ days = 30 }) => ({
                url: '/admin/statistics/analytics/reading-speed',
                method: 'GET',
                params: { days },
            }),
            providesTags: ['Analytics'],
        }),

        getGeographicDistribution: builder.query<GeographicData[], void>({
            query: () => ({
                url: '/admin/statistics/analytics/geographic',
                method: 'GET',
            }),
            providesTags: ['Analytics'],
        }),

        getActiveUsers: builder.query<ActiveUsersData, void>({
            query: () => ({
                url: '/admin/statistics/analytics/active-users',
                method: 'GET',
            }),
            providesTags: ['ActiveUsers'],
        }),

        seedReadingHistory: builder.mutation<any, { days?: number }>({
            query: ({ days = 30 }) => ({
                url: '/admin/statistics/seed-reading-history',
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

