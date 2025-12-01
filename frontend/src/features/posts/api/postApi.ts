import { createApi } from '@reduxjs/toolkit/query/react';
import { Post } from '../../posts/types/post.interface';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_POSTS_ENDPOINTS } from '@/src/constants/client-endpoints';

export interface CreatePostRequest {
  bookId: string;
  content: string;
  images?: File[];
}

export interface UpdatePostRequest {
  content?: string;
  bookId?: string;
  images?: File[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedPostsResponse {
  items: Post[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeleteImageRequest {
  imageUrl: string;
}

export const postApi = createApi({
  reducerPath: 'postApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Post', 'PostDetail'],
  endpoints: (builder) => ({
    // Lấy danh sách posts với pagination (lazy loading)
    getPosts: builder.query<PaginatedPostsResponse, PaginationParams>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: BFF_POSTS_ENDPOINTS.getAll,
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

    // Lấy chi tiết 1 post
    getPostById: builder.query<Post, string>({
      query: (id) => ({
        url: BFF_POSTS_ENDPOINTS.getOne(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'PostDetail', id }],
    }),

    getPostsByUser: builder.query<PaginatedPostsResponse, PaginationParams>({
      query: ({ page = 1, limit = 10 }) => ({
        url: BFF_POSTS_ENDPOINTS.getAllByUser,
        method: 'GET',
        params: { page, limit },
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

    // Tạo post mới
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
          url: BFF_POSTS_ENDPOINTS.create,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    // Cập nhật post
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
            url: BFF_POSTS_ENDPOINTS.update(id),
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

    // Xóa mềm post
    deletePost: builder.mutation<{ message: string; id: string }, string>({
      query: (id) => ({
        url: BFF_POSTS_ENDPOINTS.delete(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id: 'LIST' },
        { type: 'PostDetail', id },
      ],
    }),

    // Xóa vĩnh viễn post
    deletePostPermanent: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: BFF_POSTS_ENDPOINTS.deletePermanent(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id: 'LIST' },
        { type: 'PostDetail', id },
      ],
    }),

    // Xóa một ảnh trong post
    deletePostImage: builder.mutation<
      { message: string; imageUrls: string[] },
      { id: string; data: DeleteImageRequest }
    >({
      query: ({ id, data }) => ({
        url: BFF_POSTS_ENDPOINTS.deleteImage(id),
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
