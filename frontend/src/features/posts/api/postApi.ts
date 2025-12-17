import { createApi } from '@reduxjs/toolkit/query/react';
import { CreatePostRequest, DeleteImageRequest, PaginatedPostsResponse, PaginationParams, PaginationParamsByUser, Post, UpdatePostRequest } from '../../posts/types/post.interface';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_POSTS_ENDPOINTS } from '@/src/constants/server-endpoints';


export const postApi = createApi({
  reducerPath: 'postApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Post', 'PostDetail'],
  endpoints: (builder) => ({
    getPosts: builder.query<PaginatedPostsResponse, PaginationParams>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: NESTJS_POSTS_ENDPOINTS.getAll,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.items.map(({ id }) => ({
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
      providesTags: (result, error, id) => [{ type: 'PostDetail', id }],
    }),

    getPostsByUser: builder.query<PaginatedPostsResponse, PaginationParamsByUser>({
      query: ({ page = 1, limit = 10, userId }) => ({
        url: NESTJS_POSTS_ENDPOINTS.getAllByUsers,
        method: 'GET',
        params: { page, limit, userId },
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.items.map(({ id }) => ({
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
