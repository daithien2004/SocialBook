import { User } from '../../users/types/user.types';
import { Book } from '../../books/types/book.interface';

export interface Post {
  id: string;
  user: User;
  book: Book;
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
  imageUrls?: string[];
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginationParamsByUser extends PaginationParams {
  userId: string;
}

export interface PaginatedPostsResponse {
  data: Post[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface DeleteImageRequest {
  imageUrl: string;
}

