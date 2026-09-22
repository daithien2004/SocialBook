import { z } from 'zod';
import type { PaginatedApiResult, PaginationMeta } from '@/lib/api-response';
import { paginationMetaSchema } from '@/lib/pagination.schema';

export const BOOK_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  COMPLETED: 'completed',
} as const;

export const bookStatusSchema = z.enum([
  BOOK_STATUS.DRAFT,
  BOOK_STATUS.PUBLISHED,
  BOOK_STATUS.COMPLETED,
]);
export type BookStatus = z.infer<typeof bookStatusSchema>;

export const authorRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type AuthorRef = z.infer<typeof authorRefSchema>;

export const genreSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type GenreSummary = z.infer<typeof genreSummarySchema>;

export const bookStatsSchema = z.object({
  views: z.number(),
  likes: z.number(),
  chapterCount: z.number(),
  averageRating: z.number(),
  totalRatings: z.number(),
});
export type BookStats = z.infer<typeof bookStatsSchema>;

export const bookSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  authorId: authorRefSchema,
  chapterCount: z.number().optional(),
  genres: z.array(genreSummarySchema),
  description: z.string(),
  publishedYear: z.string(),
  coverUrl: z.string(),
  status: bookStatusSchema,
  tags: z.array(z.string()),
  likedBy: z.array(z.string()),
  stats: bookStatsSchema,
  isSemantic: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BookSummary = z.infer<typeof bookSummarySchema>;

export const bookChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  orderIndex: z.number(),
  viewsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type BookChapter = z.infer<typeof bookChapterSchema>;

export const bookDetailSchema = bookSummarySchema.extend({
  chapters: z.array(bookChapterSchema),
});
export type BookDetail = z.infer<typeof bookDetailSchema>;

export type Book = BookDetail;

const bookAdminStatsSchema = z.object({
  views: z.number(),
  likes: z.coerce.number(),
  chapterCount: z.number(),
});

export const bookAdminSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  authorId: authorRefSchema,
  chapterCount: z.number().optional(),
  genres: z.array(genreSummarySchema),
  description: z.string(),
  publishedYear: z.string(),
  coverUrl: z.string(),
  status: bookStatusSchema,
  tags: z.array(z.string()),
  likedBy: z.array(z.string()),
  stats: bookAdminStatsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BookForAdmin = z.infer<typeof bookAdminSchema>;

export const bookSummaryPageSchema = z.object({
  data: z.array(bookSummarySchema),
  meta: paginationMetaSchema,
});
export type BookSummaryPage = z.infer<typeof bookSummaryPageSchema>;

export const bookAdminPageSchema = z.object({
  data: z.array(bookAdminSchema),
  meta: paginationMetaSchema,
});
export type AdminBooksData = z.infer<typeof bookAdminPageSchema>;

export const filtersDataSchema = z.object({
  genres: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      count: z.number(),
    }),
  ),
  tags: z.array(
    z.object({
      name: z.string(),
      count: z.number(),
    }),
  ),
});
export type FiltersData = z.infer<typeof filtersDataSchema>;

export const likeResultSchema = z.object({
  slug: z.string(),
  isLiked: z.boolean(),
  likes: z.number(),
});
export type LikeResult = z.infer<typeof likeResultSchema>;

export const bookViewStatsSchema = z.object({
  views: z.number(),
  likes: z.number(),
  chapterCount: z.number(),
});
export type BookViewStats = z.infer<typeof bookViewStatsSchema>;

export const BOOK_ORDER_FIELD = {
  VIEWS: 'views',
  LIKES: 'likes',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  RATING: 'rating',
} as const;

export type BookOrderField = (typeof BOOK_ORDER_FIELD)[keyof typeof BOOK_ORDER_FIELD];

export interface GetBookParams {
  bookSlug: string;
}

export interface GetBooksParams {
  page?: number;
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

export type BackendPagination = PaginationMeta;

export type PaginatedData<T> = PaginatedApiResult<T>;

export interface TabState {
  books: BookSummary[];
  page: number;
  hasMore: boolean;
  isInitialized: boolean;
}

export type TabStates = Record<TabType, TabState>;

import type { TabType } from '../books.constants';