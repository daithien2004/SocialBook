import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import {
    NESTJS_COMMENTS_ENDPOINTS,
    NESTJS_LIKES_ENDPOINTS,
} from '@/constants/server-endpoints';
import {
    GetCommentsResponse,
    GetCommentsRequest,
    ResolveParentResponse,
    GetResolveParentRequest,
    PostCommentsResponse,
    PostCommentsRequest,
    PostToggleLikeResponse,
    PostToggleLikeRequest,
    CommentRequest,
    EditCommentRequest,
    EditCommentResponse,
    DeleteCommentRequest,
    GetReplyCountByParentResponse,
    GetReplyCountByParentRequest
} from '../types/comment.interface';

export const commentApi = createApi({
    reducerPath: 'commentApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Comment'],
    endpoints: (builder) => ({
        getCommentsByTarget: builder.query<GetCommentsResponse, GetCommentsRequest>(
            {
                query: ({ targetId, parentId, cursor, limit }) => ({
                    url: NESTJS_COMMENTS_ENDPOINTS.getCommentsByTarget,
                    method: 'GET',
                    params: { targetId, parentId, cursor, limit },
                }),
                providesTags: (result, error, arg) => {
                    const threadTag = {
                        type: 'Comment' as const,
                        id: `THREAD-${arg.targetId}-${arg.parentId ?? 'root'}`,
                    };

                    if (!result?.data) return [threadTag];

                    return [
                        threadTag,
                        ...result.data.map((c) => ({
                            type: 'Comment' as const,
                            id: c.id,
                        })),
                    ];
                },
            }
        ),

        getResolveParent: builder.query<
            ResolveParentResponse,
            GetResolveParentRequest
        >({
            query: ({ targetId, parentId, targetType }) => ({
                url: NESTJS_COMMENTS_ENDPOINTS.getResolveParent,
                method: 'GET',
                params: { targetId, parentId, targetType },
            }),
        }),

        postCreate: builder.mutation<PostCommentsResponse, PostCommentsRequest>({
            query: (data) => ({
                url: NESTJS_COMMENTS_ENDPOINTS.postCreate,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (_, __, arg) => [
                {
                    type: 'Comment',
                    id: `THREAD-${arg.targetId}-${arg.parentId ?? 'root'}`,
                },
                {
                    type: 'Comment',
                    id: `COUNT-${arg.targetType}-${arg.targetId}`,
                },
                arg.parentId
                    ? {
                        type: 'Comment',
                        id: `REPLY-COUNT-${arg.parentId}`,
                    }
                    : undefined,
            ],
        }),

        postToggleLike: builder.mutation<
            PostToggleLikeResponse,
            PostToggleLikeRequest
        >({
            query: (data) => ({
                url: NESTJS_LIKES_ENDPOINTS.postToggleLike,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (_, __, arg) => [
                {
                    type: 'Comment',
                    id: `THREAD-${arg.postId}-${arg.parentId ?? 'root'}`,
                },
            ],
        }),

        getCommentCount: builder.query<{ count: number }, CommentRequest>({
            query: ({ targetId, targetType }) => ({
                url: NESTJS_COMMENTS_ENDPOINTS.getCount,
                method: "GET",
                params: { targetId, targetType },
            }),
            providesTags: (result, error, arg) => [
                {
                    type: 'Comment' as const,
                    id: `COUNT-${arg.targetType}-${arg.targetId}`,
                },
            ],
        }),

        editComment: builder.mutation<
            EditCommentResponse,
            EditCommentRequest
        >({
            query: ({ id, content }) => ({
                url: NESTJS_COMMENTS_ENDPOINTS.editComment(id),
                method: 'POST',
                body: { content },
            }),
            invalidatesTags: (_, __, arg) => [
                {
                    type: 'Comment',
                    id: `THREAD-${arg.targetId}-${arg.parentId ?? 'root'}`,
                },
            ],
        }),

        deleteComment: builder.mutation<
            void,
            DeleteCommentRequest
        >({
            query: ({ id }) => ({
                url: NESTJS_COMMENTS_ENDPOINTS.deleteComment(id),
                method: 'POST',
            }),
            invalidatesTags: (_, __, arg) => [
                {
                    type: 'Comment',
                    id: `THREAD-${arg.targetId}-${arg.parentId ?? 'root'}`,
                },
            ],
        }),

        getReplyCountByParent: builder.query<
            GetReplyCountByParentResponse,
            GetReplyCountByParentRequest
        >({
            query: ({ parentId }) => ({
                url: NESTJS_COMMENTS_ENDPOINTS.getReplyCountByParent(parentId),
                method: 'GET',
            }),
            providesTags: (result, error, arg) => [
                {
                    type: 'Comment' as const,
                    id: `REPLY-COUNT-${arg.parentId}`,
                },
            ],
        }),
    }),
});

export const {
    useLazyGetCommentsByTargetQuery,
    usePostCreateMutation,
    useLazyGetResolveParentQuery,
    useGetCommentCountQuery,
    usePostToggleLikeMutation,
    useGetReplyCountByParentQuery,

    useEditCommentMutation,
    useDeleteCommentMutation,
} = commentApi;
