import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/nestjs-client-api";
import { extractArrayData, extractObjectData } from "@/lib/api-response";

export interface FollowStateResponse {
    isOwner: boolean;
    isFollowing: boolean;
    followId?: string;
    userId?: string;
    targetId?: string;
}

export interface FollowingUser {
    id: string;
    userId: string;
    targetId: string;
    image?: string;
    username: string;
    postCount: number;
    readingListCount: number;
    followersCount: number;
    isFollowedByCurrentUser: boolean;
}

export const followApi = createApi({
    reducerPath: 'followApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Follow'],
    endpoints: (builder) => ({
        getFollowingList: builder.query<FollowingUser[], string>({
            query: (userId) => ({
                url: `/follows/following?userId=${userId}`,
                method: "GET",
            }),
            transformResponse: extractArrayData<FollowingUser>,
            providesTags: () => [
                { type: "Follow", id: `FOLLOWING_LIST` },
            ],
        }),

        getFollowersList: builder.query<FollowingUser[], string>({
            query: (targetUserId) => ({
                url: `/follows/followers?targetUserId=${targetUserId}`,
                method: "GET",
            }),
            transformResponse: extractArrayData<FollowingUser>,
            providesTags: () => [
                { type: "Follow", id: `FOLLOWERS_LIST` },
            ],
        }),

        getFollowStatus: builder.query<FollowStateResponse, string>({
            query: (targetId) => ({
                url: `/follows/status?targetId=${targetId}`,
                method: "GET",
            }),
            transformResponse: extractObjectData<FollowStateResponse>,
            providesTags: (_, __, targetId) => [
                { type: "Follow", id: `STATUS-${targetId}` },
            ],
        }),

        toggleFollow: builder.mutation<FollowStateResponse, string>({
            query: (targetUserId) => ({
                url: `/follows`,
                method: "POST",
                body: { targetId: targetUserId },
            }),
            invalidatesTags: (_, __, targetUserId) => [
                { type: "Follow", id: `FOLLOWING_LIST` },
                { type: "Follow", id: `FOLLOWERS_LIST` },
                { type: "Follow", id: `STATUS-${targetUserId}` },
            ],
        }),

        unfollow: builder.mutation<void, string>({
            query: (targetId) => ({
                url: `/follows/${targetId}`,
                method: "DELETE",
            }),
            invalidatesTags: (_, __, targetId) => [
                { type: "Follow", id: `FOLLOWING_LIST` },
                { type: "Follow", id: `FOLLOWERS_LIST` },
                { type: "Follow", id: `STATUS-${targetId}` },
            ],
        }),
    }),
});

export const {
    useGetFollowingListQuery,
    useGetFollowersListQuery,
    useGetFollowStatusQuery,
    useToggleFollowMutation,
    useUnfollowMutation,
} = followApi;
