import { createApi } from '@reduxjs/toolkit/query/react';
import { Post } from '../../posts/types/post.interface';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_POSTS_ENDPOINTS } from '@/src/constants/client-endpoints';

export interface CreatePostRequest {
  userId: string;
  bookId: string;
  content: string;
  images?: File[];
}

export const postApi = createApi({
  reducerPath: 'postApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.mutation<Post[], void>({
      query: () => ({
        url: BFF_POSTS_ENDPOINTS.getAll,
        method: 'GET',
      }),
      invalidatesTags: ['Post'],
    }),

    createPost: builder.mutation<Post, CreatePostRequest>({
      query: (data) => {
        const formData = new FormData();
        formData.append('userId', data.userId);
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
      invalidatesTags: ['Post'],
    }),
  }),
});

export const { useGetPostsMutation, useCreatePostMutation } = postApi;
