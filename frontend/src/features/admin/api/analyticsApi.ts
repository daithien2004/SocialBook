import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';

// ============ Analytics Data Types ============

export interface ReadingHeatmapData {
    hour: number; // 0-23
    count: number;
}

export interface ChapterEngagementData {
    chapterId: string;
    chapterTitle: string;
    bookTitle: string;
    viewCount: number;
    completionRate: number;
    averageTimeSpent: number;
}

export interface ReadingSpeedData {
    date: string;
    averageSpeed: number;
}

export interface GeographicData {
    country: string;
    userCount: number;
}

export interface ActiveUsersData {
    count: number;
    timestamp: string;
}

// ============ Analytics API ============

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

