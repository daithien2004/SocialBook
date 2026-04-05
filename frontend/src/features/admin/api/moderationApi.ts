import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { normalizeArrayResponse, PaginatedApiResult } from '@/lib/api-response';

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

export type FlaggedPostsResponse = PaginatedApiResult<FlaggedPost>;

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
            transformResponse: normalizeArrayResponse<FlaggedPost>,
            providesTags: ['FlaggedPosts'],
        }),

        approvePost: builder.mutation<void, string>({
            query: (postId) => ({
                url: `/posts/admin/${postId}/approve`,
                method: 'PATCH',
            }),
            invalidatesTags: ['FlaggedPosts'],
        }),

        rejectPost: builder.mutation<void, string>({
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
