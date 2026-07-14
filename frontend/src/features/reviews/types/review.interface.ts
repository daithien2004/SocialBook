import { User } from "@/features/users/types/user.types";

export interface Review {
  id: string;
  userId: string;
  user?: User;
  bookId: string;
  content: string;
  rating: number;
  likesCount: number;
  isLiked?: boolean;
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
