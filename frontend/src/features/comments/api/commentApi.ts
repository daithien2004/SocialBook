import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/src/lib/client-api";
import {BFF_COMMENTS_ENDPOINTS, BFF_LIKES_ENDPOINTS} from "@/src/constants/client-endpoints";

export interface GetCommentsRequest {
    targetId: string;
    parentId: string | null,
    cursor?: string;
    limit: number;
}

export interface PostToggleLikeRequest {
    targetId: string;
    targetType: string;
    parentId: string | null;
    postId: string;
}

export interface PostToggleLikeResponse {
    liked: boolean
}

export interface GetResolveParentRequest {
    targetId: string;
    parentId: string | null,
    targetType: string;
}

export interface PostCommentsRequest {
    targetId: string;
    parentId: string | null,
    content: string,
    targetType: string
}

export interface PostCommentsResponse {
    id: string
    userId: string
    targetId: string;
    parentId: string | null,
    content: string,
    targetType: string
}

export interface CommentItem {
    id: string;
    content: string;
    createdAt: string;
    likesCount: number;
    repliesCount: number;
    parentId: string | null,
    userId: {
        id: string;
        username: string;
        image?: string;
    } | null;
}

export interface GetCommentsResponse {
    items: CommentItem[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface ResolveParentResponse {
    parentId: string | null;
    level: number
}

export const commentApi = createApi({
    reducerPath: "commentApi",
    baseQuery: axiosBaseQuery(),
    tagTypes: ["Comment"],
    endpoints: (builder) => ({
        getCommentsByTarget: builder.query<
            GetCommentsResponse,
            GetCommentsRequest
        >({
            query: ({ targetId, parentId, cursor, limit }) => ({
                url: BFF_COMMENTS_ENDPOINTS.getCommentsByTarget,
                method: "GET",
                params: { targetId, parentId, cursor, limit },
            }),
            providesTags: (result, error, arg) => {
                const threadTag = {
                    type: "Comment" as const,
                    id: `THREAD-${arg.targetId}-${arg.parentId ?? "root"}`,
                };

                if (!result?.items) return [threadTag];

                return [
                    threadTag,
                    ...result.items.map((c) => ({
                        type: "Comment" as const,
                        id: c.id,
                    })),
                ];
            },
        }),

        getResolveParent: builder.query<
            ResolveParentResponse,
            GetResolveParentRequest
        >({
            query: ({ targetId, parentId, targetType }) => ({
                url: BFF_COMMENTS_ENDPOINTS.getResolveParent,
                method: "GET",
                params: { targetId, parentId, targetType },
            }),
        }),

        postCreate: builder.mutation<PostCommentsResponse, PostCommentsRequest>({
            query: (data) => ({
                url: BFF_COMMENTS_ENDPOINTS.postCreateComment,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (_, __, arg) => [
                {
                    type: "Comment",
                    id: `THREAD-${arg.targetId}-${arg.parentId ?? "root"}`,
                },
            ],
        }),

        postToggleLike: builder.mutation<PostToggleLikeResponse, PostToggleLikeRequest>({
            query: (data) => ({
                url: BFF_LIKES_ENDPOINTS.postToggleLike,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (_, __, arg) => [
                {
                    type: "Comment",
                    id: `THREAD-${arg.postId}-${arg.parentId ?? "root"}`,
                },
            ],
        }),
    }),
});

export const {
    useLazyGetCommentsByTargetQuery,
    usePostCreateMutation,
    useLazyGetResolveParentQuery,
    usePostToggleLikeMutation
} = commentApi;
