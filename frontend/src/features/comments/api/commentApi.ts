import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/src/lib/client-api";
import { BFF_COMMENTS_ENDPOINTS } from "@/src/constants/client-endpoints";

export interface GetLevel1CommentsRequest {
    targetId: string;
    parentId: string | null,
    cursor?: string;
    limit: number;
}

export interface CommentItem {
    id: string;
    content: string;
    createdAt: string;
    likesCount: number;
    repliesCount: number;
    user: {
        id: string;
        username: string;
        image?: string;
    } | null;
}

export interface GetLevel1CommentsResponse {
    items: CommentItem[];
    nextCursor: string | null;
    hasMore: boolean;
}

export const commentApi = createApi({
    reducerPath: "commentApi",
    baseQuery: axiosBaseQuery(),
    tagTypes: ["Comment"],
    endpoints: (builder) => ({
        getCommentsByTarget: builder.query<
            GetLevel1CommentsResponse,
            GetLevel1CommentsRequest
        >({
            query: ({ targetId, parentId, cursor, limit }) => ({
                url: BFF_COMMENTS_ENDPOINTS.getCommentsByTarget,
                method: "GET",
                params: { targetId, parentId, cursor, limit },
            }),
        }),
    }),
});

export const { useLazyGetCommentsByTargetQuery, useGetCommentsByTargetQuery} = commentApi;
