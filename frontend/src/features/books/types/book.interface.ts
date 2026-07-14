import type { PaginatedApiResult, PaginationMeta } from '@/lib/api-response';
import { TabType } from "../books.constants";
import { Chapter } from '@/features/chapters/types/chapter.interface';

export interface Book {
  id: string;
  authorId: Author;
  genres: Genre[];
  title: string;
  slug: string;
  publishedYear: string;
  description: string;
  coverUrl: string;
  status: 'draft' | 'published' | 'completed';
  tags: string[];
  likedBy: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  reviews: Review[];
  chapters: Chapter[];
  totalRatings: number;
  averageRating: number;
  stats: {
    averageRating: number;
    totalRatings: number;
    chapterCount: number;
    views: number;
    likes: number;
  };
  isSemantic?: boolean;
}

import type { Author } from '@/features/authors/types/author.interface';
import type { Genre } from '@/features/genres/types/genre.interface';
export type { Author, Genre };

export interface Review {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
    image?: string;
  };
  likesCount: number;
  createdAt: string;
}

export interface BookForAdmin {
  id: string;
  authorId: {
    id: string;
    name: string;
  };
  genres: {
    id: string;
    name: string;
  }[];
  title: string;
  slug: string;
  publishedYear: string;
  description: string;
  coverUrl: string;
  status: 'draft' | 'published' | 'completed';
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    chapterCount: number;
    views: number;
    likes: string; // backend trả về string
  };
}

export type BackendPagination = PaginationMeta;

export const BOOK_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  COMPLETED: 'completed',
} as const;

export type BookStatus = typeof BOOK_STATUS[keyof typeof BOOK_STATUS];

export const BOOK_ORDER_FIELD = {
  VIEWS: 'views',
  LIKES: 'likes',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  RATING: 'rating',
} as const;

export type BookOrderField = typeof BOOK_ORDER_FIELD[keyof typeof BOOK_ORDER_FIELD];

export interface GetBookParams {
  bookSlug: string;
}

export interface GetBooksParams {
  page: number;
  limit?: number;
  search?: string;
  genres?: string;
  tags?: string;
  mode?: 'keyword' | 'semantic' | 'hybrid';
  sortBy?: BookOrderField;
  order?: 'asc' | 'desc';
  status?: BookStatus | 'all';
}

export interface GetAdminBooksParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BookStatus;
}

export interface UpdateBookParams {
  bookId: string;
  formData: FormData;
}


export interface BookStats {
  views: number;
  likes: number;
  chapterCount: number;
}

export type AdminBooksData = PaginatedApiResult<BookForAdmin>;

export interface FiltersData {
  genres: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
  tags: Array<{
    name: string;
    count: number;
  }>;
}

export interface LikeResult {
  slug: string;
  isLiked: boolean;
  likes: number;
}

export type PaginatedData<T> = PaginatedApiResult<T>;

export interface TabState {
  books: Book[];
  page: number;
  hasMore: boolean;
  isInitialized: boolean;
}

export type TabStates = Record<TabType, TabState>;
