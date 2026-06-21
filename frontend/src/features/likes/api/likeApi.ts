import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/nestjs-client-api";
import { NESTJS_LIKES_ENDPOINTS } from "@/constants/server-endpoints";
import { recommendationsApi } from '../../recommendations/api/recommendationsApi';
import { postApi } from '../../posts/api/postApi';
import type { PaginatedPostsResponse, Post } from '../../posts/types/post.interface';
import type { RootState } from '@/store/store';

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
                url: NESTJS_LIKES_ENDPOINTS.postToggleLike,
                method: "POST",
                body: { targetId, targetType },
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Like", id: `${arg.targetType}-${arg.targetId}` },
            ],
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                const patchResults: { undo: () => void }[] = [];

                if (arg.targetType === 'post') {
                    const state = getState() as RootState;
                    const queries = state.postApi?.queries || {};

                    for (const [key, query] of Object.entries(queries)) {
                        if (!query) continue;

                        const q = query as { originalArgs?: unknown };
                        if (q.originalArgs === undefined) continue;

                        const originalArgs = q.originalArgs;

                        if (key.startsWith('getPosts(') || key.startsWith('getPostsByUser(')) {
                            const endpointName = key.startsWith('getPosts(') ? 'getPosts' : 'getPostsByUser';
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const patchResult = dispatch(
                                postApi.util.updateQueryData(endpointName, originalArgs as any, (draft: PaginatedPostsResponse) => {
                                    const post = draft.data?.find(p => p.id === arg.targetId);
                                    if (post) {
                                        const wasLiked = post.likedByCurrentUser;
                                        post.likedByCurrentUser = !wasLiked;
                                        post.totalLikes = Math.max(0, (post.totalLikes || 0) + (wasLiked ? -1 : 1));
                                    }
                                })
                            );
                            patchResults.push(patchResult);
                        } else if (key.startsWith('getPostById(')) {
                            const patchResult = dispatch(
                                postApi.util.updateQueryData('getPostById', originalArgs as unknown as { id: string; userId?: string }, (draft: Post) => {
                                    if (draft.id === arg.targetId) {
                                        const wasLiked = draft.likedByCurrentUser;
                                        draft.likedByCurrentUser = !wasLiked;
                                        draft.totalLikes = Math.max(0, (draft.totalLikes || 0) + (wasLiked ? -1 : 1));
                                    }
                                })
                            );
                            patchResults.push(patchResult);
                        }
                    }
                }

                try {
                    await queryFulfilled;
                    if (arg.targetType === 'Book') {
                        dispatch(recommendationsApi.util.resetApiState());
                    }
                } catch {
                    patchResults.forEach(pr => pr.undo());
                }
            },
        }),

        getCount: builder.query<{ count: number }, LikeRequest>({
            query: ({ targetId, targetType }) => ({
                url: NESTJS_LIKES_ENDPOINTS.getCount,
                method: "GET",
                params: { targetId, targetType },
            }),
            providesTags: (result, error, arg) => [
                { type: "Like", id: `${arg.targetType}-${arg.targetId}` },
            ],
        }),

        getStatus: builder.query<{ isLiked: boolean }, LikeRequest>({
            query: ({ targetId, targetType }) => ({
                url: NESTJS_LIKES_ENDPOINTS.getStatus,
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
