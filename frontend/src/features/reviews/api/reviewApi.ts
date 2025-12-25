import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_REVIEWS_ENDPOINTS } from '@/src/constants/server-endpoints';
import {
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '../types/review.interface';
import { recommendationsApi } from '../../recommendations/api/recommendationsApi';

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Review'],
  endpoints: (builder) => ({
    getReviewsByBook: builder.query<Review[], string>({
      query: (bookId) => ({
        url: NESTJS_REVIEWS_ENDPOINTS.getByBook(bookId),
        method: 'GET',
      }),
      providesTags: (result, error, bookId) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Review' as const, id })),
            { type: 'Review', id: `LIST_${bookId}` },
          ]
          : [],
    }),

    createReview: builder.mutation<Review, CreateReviewRequest>({
      query: (data) => ({
        url: NESTJS_REVIEWS_ENDPOINTS.create,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { bookId }) => [
        { type: 'Review', id: `LIST_${bookId}` },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(recommendationsApi.util.resetApiState());
      },
    }),

    updateReview: builder.mutation<
      Review,
      { id: string; data: UpdateReviewRequest; bookId: string }
    >({
      query: ({ id, data }) => ({
        url: NESTJS_REVIEWS_ENDPOINTS.update(id),
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id, bookId }) => [
        { type: 'Review', id },
        { type: 'Review', id: `LIST_${bookId}` },
      ],
    }),

    deleteReview: builder.mutation<null, { id: string; bookId: string }>({
      query: ({ id }) => ({
        url: NESTJS_REVIEWS_ENDPOINTS.delete(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id, bookId }) => [
        { type: 'Review', id },
        { type: 'Review', id: `LIST_${bookId}` },
      ],
    }),

    toggleLikeReview: builder.mutation<
      { likesCount: number; isLiked: boolean },
      { id: string; bookId: string }
    >({
      query: ({ id }) => ({
        url: NESTJS_REVIEWS_ENDPOINTS.toggleLike(id),
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id, bookId }) => [
        { type: 'Review', id },
        { type: 'Review', id: `LIST_${bookId}` },
      ],
    }),
  }),
});

export const {
  useGetReviewsByBookQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useToggleLikeReviewMutation,
} = reviewApi;
