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
    DeleteCommentRequest
} from '../types/comment.interface';
import { postApi } from '../../posts/api/postApi';
import type { PaginatedPostsResponse, Post } from '../../posts/types/post.interface';
import type { RootState } from '@/store/store';

type RawCommentsResponse = {
    comments?: GetCommentsResponse['comments'];
    meta?: {
        nextCursor?: string | null;
        hasMore?: boolean;
    };
};

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
                transformResponse: (response: RawCommentsResponse): GetCommentsResponse => ({
                    comments: response.comments ?? [],
                    nextCursor: response.meta?.nextCursor ?? null,
                    hasMore: response.meta?.hasMore ?? false,
                }),
                providesTags: (result, error, arg) => {
                    const threadTag = {
                        type: 'Comment' as const,
                        id: `THREAD-${arg.targetId}-${arg.parentId ?? 'root'}`,
                    };

                    if (!result?.comments) return [threadTag];

                    return [
                        threadTag,
                        ...result.comments.map((c) => ({
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

            invalidatesTags: (result) => {
                if (!result) return [];

                return [
                    {
                        type: 'Comment',
                        id: `THREAD-${result.targetId}-${result.parentId ?? 'root'}`,
                    },
                    {
                        type: 'Comment',
                        id: `COUNT-${result.targetType}-${result.targetId}`,
                    },
                    result.parentId
                        ? {
                            type: 'Comment',
                            id: `REPLY-COUNT-${result.parentId}`,
                        }
                        : undefined,
                ].filter(Boolean) as { type: 'Comment'; id: string }[];
            },

            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                const patchResults: { undo: () => void }[] = [];

                if (arg.targetType === 'post' && !arg.parentId) {
                    const state = getState() as RootState;
                    const queries = state.postApi?.queries || {};

                    for (const [key, query] of Object.entries(queries)) {
                        if (!query) continue;

                        const q = query as { originalArgs?: unknown };
                        if (q.originalArgs === undefined) continue;

                        const originalArgs = q.originalArgs;

                        if (key.startsWith('getPosts(') || key.startsWith('getPostsByUser(')) {
                            const endpointName = key.startsWith('getPosts(') ? 'getPosts' : 'getPostsByUser';
                             
                            const patchResult = dispatch(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                postApi.util.updateQueryData(endpointName, originalArgs as any, (draft: PaginatedPostsResponse) => {
                                    const post = draft.data?.find(p => p.id === arg.targetId);
                                    if (post) {
                                        post.totalComments = (post.totalComments || 0) + 1;
                                    }
                                })
                            );
                            patchResults.push(patchResult);
                        } else if (key.startsWith('getPostById(')) {
                            const patchResult = dispatch(
                                postApi.util.updateQueryData('getPostById', originalArgs as unknown as { id: string; userId?: string }, (draft: Post) => {
                                    if (draft.id === arg.targetId) {
                                        draft.totalComments = (draft.totalComments || 0) + 1;
                                    }
                                })
                            );
                            patchResults.push(patchResult);
                        }
                    }
                }

                try {
                    await queryFulfilled;
                } catch {
                    patchResults.forEach(pr => pr.undo());
                }
            },
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
                method: 'PUT',
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
                method: 'DELETE',
            }),
            invalidatesTags: (_, __, arg) => [
                {
                    type: 'Comment',
                    id: `THREAD-${arg.targetId}-${arg.parentId ?? 'root'}`,
                },
                {
                    type: 'Comment',
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
    useEditCommentMutation,
    useDeleteCommentMutation,
} = commentApi;
