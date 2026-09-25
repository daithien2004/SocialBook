import { NESTJS_REVIEWS_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/api-client';
import {
  CreateReviewRequest,
  Review,
  UpdateReviewRequest,
} from '../types/review.interface';

export type {
  CreateReviewRequest,
  Review,
  UpdateReviewRequest,
} from '../types/review.interface';

export interface ToggleLikeReviewResult {
  likesCount: number;
  isLiked: boolean;
}

export async function getReviewsByBook(bookId: string): Promise<Review[]> {
  return apiRequest<Review[]>({
    url: NESTJS_REVIEWS_ENDPOINTS.getByBook(bookId),
    method: 'GET',
  });
}

export async function createReview(data: CreateReviewRequest): Promise<Review> {
  return apiRequest<Review>({
    url: NESTJS_REVIEWS_ENDPOINTS.create,
    method: 'POST',
    data,
  });
}

export async function updateReview({
  id,
  data,
}: {
  id: string;
  data: UpdateReviewRequest;
  bookId: string;
}): Promise<Review> {
  return apiRequest<Review>({
    url: NESTJS_REVIEWS_ENDPOINTS.update(id),
    method: 'PATCH',
    data,
  });
}

export async function deleteReview({
  id,
}: {
  id: string;
  bookId: string;
}): Promise<null> {
  return apiRequest<null>({
    url: NESTJS_REVIEWS_ENDPOINTS.delete(id),
    method: 'DELETE',
  });
}

export async function toggleLikeReview({
  id,
}: {
  id: string;
  bookId: string;
}): Promise<ToggleLikeReviewResult> {
  return apiRequest<ToggleLikeReviewResult>({
    url: NESTJS_REVIEWS_ENDPOINTS.toggleLike(id),
    method: 'PATCH',
  });
}