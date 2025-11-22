import { User } from '../../auth/slice/authSlice';

export interface Review {
  id: string;
  userId: User;
  bookId: string;
  content: string;
  rating: number;
  likesCount: number;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  bookId: string;
  content: string;
  rating: number;
}

export interface UpdateReviewRequest {
  content?: string;
  rating?: number;
}
