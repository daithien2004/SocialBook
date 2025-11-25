import {createApi} from "@reduxjs/toolkit/query/react";
import {axiosBaseQuery} from "@/src/lib/client-api";

export interface FollowStateResponse {
    isOwner: boolean;
    isFollowing: boolean;
}

export interface FollowingUser {
    id: string;
    image?: string;
    username: string;
    postCount: number,
    readingListCount: number,
    followersCount: number,
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
            transformResponse: (response: FollowingUser[]) => response ?? [],
            providesTags: () => [
                { type: "Follow", id: `FOLLOWING_LIST` },
            ],
        }),

        toggleFollow: builder.mutation<FollowStateResponse, string>({
            query: (targetUserId) => ({
                url: `/follows/${targetUserId}`,
                method: "POST",
            }),
            invalidatesTags: () => [
                { type: "Follow", id: `FOLLOWING_LIST` },
            ],
        }),
    }),
});

export const {
    useToggleFollowMutation,
    useGetFollowingListQuery
} = followApi