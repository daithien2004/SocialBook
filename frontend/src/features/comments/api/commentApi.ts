import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import {
  BFF_COMMENTS_ENDPOINTS,
  BFF_LIKES_ENDPOINTS,
} from '@/src/constants/client-endpoints';
import { GetCommentsResponse, GetCommentsRequest, ResolveParentResponse, GetResolveParentRequest, PostCommentsResponse, PostCommentsRequest, PostToggleLikeResponse, PostToggleLikeRequest, CommentRequest } from '../types/comment.interface';

export const commentApi = createApi({
  reducerPath: 'commentApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Comment'],
  endpoints: (builder) => ({
    getCommentsByTarget: builder.query<GetCommentsResponse, GetCommentsRequest>(
      {
        query: ({ targetId, parentId, cursor, limit }) => ({
          url: BFF_COMMENTS_ENDPOINTS.getCommentsByTarget,
          method: 'GET',
          params: { targetId, parentId, cursor, limit },
        }),
        providesTags: (result, error, arg) => {
          const threadTag = {
            type: 'Comment' as const,
            id: `THREAD-${arg.targetId}-${arg.parentId ?? 'root'}`,
          };

          if (!result?.items) return [threadTag];

          return [
            threadTag,
            ...result.items.map((c) => ({
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
        url: BFF_COMMENTS_ENDPOINTS.getResolveParent,
        method: 'GET',
        params: { targetId, parentId, targetType },
      }),
    }),

    postCreate: builder.mutation<PostCommentsResponse, PostCommentsRequest>({
      query: (data) => ({
        url: BFF_COMMENTS_ENDPOINTS.postCreateComment,
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
      ],
    }),

    postToggleLike: builder.mutation<
      PostToggleLikeResponse,
      PostToggleLikeRequest
    >({
      query: (data) => ({
        url: BFF_LIKES_ENDPOINTS.postToggleLike,
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
        url: BFF_COMMENTS_ENDPOINTS.getCount,
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
  }),
});

export const {
  useLazyGetCommentsByTargetQuery,
  usePostCreateMutation,
  useLazyGetResolveParentQuery,
  useGetCommentCountQuery,
  usePostToggleLikeMutation,
} = commentApi;
