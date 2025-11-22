import {createApi} from "@reduxjs/toolkit/query/react";
import {axiosBaseQuery} from "@/src/lib/client-api";
import { BFF_FOLLOWS_ENDPOINTS} from "@/src/constants/client-endpoints";

export interface FollowStateResponse {
    isOwner: boolean;
    isFollowing: boolean;
}

export const followApi = createApi({
    reducerPath: 'followApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Follow'],
    endpoints: (builder) => ({
        getFollowState: builder.query<FollowStateResponse, string>({
            query: (targetUserId) => ({
                url: `${BFF_FOLLOWS_ENDPOINTS.getFollowState}/${targetUserId}`,
                method: 'GET',
            }),
            providesTags: (result, error, targetUserId) =>
                result
                    ? [{ type: 'Follow', id: targetUserId }]
                    : [{ type: 'Follow', id: 'LIST' }],
        }),

        toggleFollow: builder.mutation<FollowStateResponse, string>({
            query: (targetUserId) => ({
                url: `${BFF_FOLLOWS_ENDPOINTS.toggleFollow}/${targetUserId}`,
                method: "POST",
            }),
            invalidatesTags: (result, error, targetUserId) => [
                { type: "Follow", id: targetUserId },
            ],
        }),
    }),
});

export const {
    useGetFollowStateQuery,
    useToggleFollowMutation
} = followApi