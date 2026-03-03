import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';

export interface FlaggedPost {
    id: string; // Backend TransformInterceptor converts _id → id
    user: {
        id: string;
        username: string;
        image?: string;
    };
    book: {
        id: string;
        title: string;
    };
    content: string;
    imageUrls: string[];
    isFlagged: boolean;
    moderationReason?: string;
    moderationStatus?: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

export interface FlaggedPostsResponse {
    data: FlaggedPost[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const moderationApi = createApi({
    reducerPath: 'moderationApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['FlaggedPosts'],
    endpoints: (builder) => ({
        getFlaggedPosts: builder.query<FlaggedPostsResponse, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 }) => ({
                url: '/posts/admin/flagged',
                method: 'GET',
                params: { page, limit },
            }),
            providesTags: ['FlaggedPosts'],
        }),

        approvePost: builder.mutation<any, string>({
            query: (postId) => ({
                url: `/posts/admin/${postId}/approve`,
                method: 'PATCH',
            }),
            invalidatesTags: ['FlaggedPosts'],
        }),

        rejectPost: builder.mutation<any, string>({
            query: (postId) => ({
                url: `/posts/admin/${postId}/reject`,
                method: 'DELETE',
            }),
            invalidatesTags: ['FlaggedPosts'],
        }),
    }),
});

export const {
    useGetFlaggedPostsQuery,
    useApprovePostMutation,
    useRejectPostMutation,
} = moderationApi;
