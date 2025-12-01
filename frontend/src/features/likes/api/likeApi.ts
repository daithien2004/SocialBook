import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/src/lib/client-api";
import { BFF_LIKES_ENDPOINTS } from "@/src/constants/client-endpoints";

export interface LikeRequest {
    targetId: string;
    targetType: string;
}

export const likeApi = createApi({
    reducerPath: "likeApi",
    baseQuery: axiosBaseQuery(),
    tagTypes: ["Like"],
    endpoints: (builder) => ({

        postToggleLike: builder.mutation<boolean, LikeRequest>({
            query: ({ targetId, targetType }) => ({
                url: BFF_LIKES_ENDPOINTS.postToggleLike,
                method: "POST",
                body: { targetId, targetType },
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Like", id: `${arg.targetType}-${arg.targetId}` },
            ],
        }),

        getCount: builder.query<{ count: number }, LikeRequest>({
            query: ({ targetId, targetType }) => ({
                url: BFF_LIKES_ENDPOINTS.getCount,
                method: "GET",
                params: { targetId, targetType },
            }),
            providesTags: (result, error, arg) => [
                { type: "Like", id: `${arg.targetType}-${arg.targetId}` },
            ],
        }),

        getStatus: builder.query<{ isLiked: boolean }, LikeRequest>({
            query: ({ targetId, targetType }) => ({
                url: BFF_LIKES_ENDPOINTS.getStatus,
                method: "GET",
                params: { targetId, targetType },
            }),
            providesTags: (result, error, arg) => [
                { type: "Like", id: `${arg.targetType}-${arg.targetId}` },
            ],
        }),
    }),
});

export const {
    usePostToggleLikeMutation,
    useGetCountQuery,
    useGetStatusQuery,
} = likeApi;
