import { User } from '../../auth/slice/authSlice';
import { Book } from '../../books/types/book.interface';

export interface Post {
  id: string;
  userId: User;
  userName: string;
  userAvatar: string;
  bookId: Book;
  bookTitle: string;
  content: string;
  imageUrls: string[];
  isDelete: boolean;
  createdAt: Date;
  totalLikes?: number;
  totalComments?: number;
  likedByCurrentUser?: boolean;

  // Moderation fields
  isFlagged?: boolean;
  moderationReason?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  warning?: string;
}

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

export interface PaginationParamsByUser {
  page?: number;
  limit?: number;
  userId: string;
}

export interface PaginatedPostsResponse {
  data: Post[];
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

