import { NESTJS_POSTS_ENDPOINTS } from '@/constants/server-endpoints';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { createApi } from '@reduxjs/toolkit/query/react';
import { CreatePostRequest, DeleteImageRequest, PaginatedPostsResponse, PaginationParams, PaginationParamsByUser, Post, UpdatePostRequest } from '../../posts/types/post.interface';

type RawPost = Post & {
  likesCount?: number;
  commentsCount?: number;
};

type RawPaginatedPostsResponse = {
  data?: RawPost[];
  meta?: PaginatedPostsResponse['meta'];
};

const normalizePost = (post: RawPost): Post => ({
  ...post,
  totalLikes: post.totalLikes ?? post.likesCount,
  totalComments: post.totalComments ?? post.commentsCount,
});

const normalizePaginatedPosts = (
  response: RawPaginatedPostsResponse
): PaginatedPostsResponse => ({
  data: (response.data ?? []).map(normalizePost),
  meta: response.meta ?? {
    nextCursor: null,
    hasMore: false,
  },
});


export const postApi = createApi({
  reducerPath: 'postApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Post', 'PostDetail'],
  endpoints: (builder) => ({
    getPosts: builder.query<PaginatedPostsResponse, PaginationParams>({
      query: ({ cursor, limit = 10 } = {}) => ({
        url: NESTJS_POSTS_ENDPOINTS.getAll,
        method: 'GET',
        params: { cursor, limit },
      }),
      transformResponse: (response: RawPaginatedPostsResponse) =>
        normalizePaginatedPosts(response),
      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }) => ({
              type: 'Post' as const,
              id: id,
            })),
            { type: 'Post', id: 'LIST' },
          ]
          : [{ type: 'Post', id: 'LIST' }],
    }),

    getPostById: builder.query<Post, string>({
      query: (id) => ({
        url: NESTJS_POSTS_ENDPOINTS.getOne(id),
        method: 'GET',
      }),
      transformResponse: (response: RawPost) => normalizePost(response),
      providesTags: (result, error, id) => [{ type: 'PostDetail', id }],
    }),

    getPostsByUser: builder.query<PaginatedPostsResponse, PaginationParamsByUser>({
      query: ({ cursor, limit = 10, userId }) => ({
        url: NESTJS_POSTS_ENDPOINTS.getAllByUsers,
        method: 'GET',
        params: { cursor, limit, userId },
      }),
      transformResponse: (response: RawPaginatedPostsResponse) =>
        normalizePaginatedPosts(response),
      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ id }) => ({
              type: 'Post' as const,
              id,
            })),
            { type: 'Post', id: 'LIST' },
          ]
          : [{ type: 'Post', id: 'LIST' }],
    }),

    createPost: builder.mutation<Post, CreatePostRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append('bookId', data.bookId);
        formData.append('content', data.content);

        if (data.images && data.images.length > 0) {
          data.images.forEach((image) => {
            formData.append('images', image);
          });
        }

        return {
          url: NESTJS_POSTS_ENDPOINTS.create,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    updatePost: builder.mutation<Post, { id: string; data: UpdatePostRequest }>(
      {
        query: ({ id, data }) => {
          const formData = new FormData();

          if (data.content !== undefined) {
            formData.append('content', data.content);
          }

          if (data.bookId) {
            formData.append('bookId', data.bookId);
          }

          if (data.images && data.images.length > 0) {
            data.images.forEach((image) => {
              formData.append('images', image);
            });
          }

          return {
            url: NESTJS_POSTS_ENDPOINTS.update(id),
            method: 'PATCH',
            body: formData,
          };
        },
        invalidatesTags: (result, error, { id }) => [
          { type: 'Post', id: 'LIST' },
          { type: 'PostDetail', id },
        ],
      }
    ),

    deletePost: builder.mutation<{ message: string; id: string }, string>({
      query: (id) => ({
        url: NESTJS_POSTS_ENDPOINTS.delete(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id: 'LIST' },
        { type: 'PostDetail', id },
      ],
    }),

    deletePostPermanent: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: NESTJS_POSTS_ENDPOINTS.deletePermanent(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id: 'LIST' },
        { type: 'PostDetail', id },
      ],
    }),

    deletePostImage: builder.mutation<
      { message: string; imageUrls: string[] },
      { id: string; data: DeleteImageRequest }
    >({
      query: ({ id, data }) => ({
        url: NESTJS_POSTS_ENDPOINTS.deleteImage(id),
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Post', id: 'LIST' },
        { type: 'PostDetail', id },
      ],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPostsByUserQuery,
  useDeletePostPermanentMutation,
  useDeletePostImageMutation,
} = postApi;
