import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationsKeys, reviewKeys } from '@/lib/query-keys';
import {
  createReview,
  deleteReview,
  toggleLikeReview,
  updateReview,
  type ToggleLikeReviewResult,
} from './review.api';
import type {
  CreateReviewRequest,
  Review,
  UpdateReviewRequest,
} from '../types/review.interface';

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation<Review, Error, CreateReviewRequest>({
    mutationFn: createReview,
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byBook(bookId) });
      queryClient.invalidateQueries({ queryKey: recommendationsKeys.all });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation<Review, Error, { id: string; data: UpdateReviewRequest; bookId: string }>({
    mutationFn: updateReview,
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byBook(bookId) });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation<null, Error, { id: string; bookId: string }>({
    mutationFn: deleteReview,
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byBook(bookId) });
    },
  });
}

export function useToggleLikeReview() {
  const queryClient = useQueryClient();
  return useMutation<ToggleLikeReviewResult, Error, { id: string; bookId: string }>({
    mutationFn: toggleLikeReview,
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byBook(bookId) });
    },
  });
}