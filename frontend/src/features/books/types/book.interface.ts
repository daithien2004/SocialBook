import { TabType } from "../books.constants";

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
  views: number;
  likes: number;
  isLiked: boolean;
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
    chapters: number;
    views: number;
    likes: number;
  };
}

export interface Author {
  id: string;
  name: string;
  bio: string;
}

export interface Genre {
  id: string;
  name: string;
  description: string;
}

export interface Chapter {
  id: string;
  title: string;
  slug: string;
  content: string;
  orderIndex: number;
  viewsCount: number;
}

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
  views: number;
  likes: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    chapters: number;
    views: number;
    likes: string; // backend trả về string
  };
}

export interface BackendPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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
  sortBy?: BookOrderField;
  order?: 'asc' | 'desc';
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
  chapters: number;
}

export interface AdminBooksData {
  books: BookForAdmin[];
  pagination: BackendPagination;
}

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

export interface PaginatedData<T> {
  data: T[];
  metaData: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TabState {
  books: Book[];
  page: number;
  hasMore: boolean;
  isInitialized: boolean;
}

export type TabStates = Record<TabType, TabState>;