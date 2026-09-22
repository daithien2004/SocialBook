import { z } from 'zod';
import { NESTJS_BOOKS_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/nestjs-client-api';
import {
  bookAdminPageSchema,
  bookAdminSchema,
  bookDetailSchema,
  bookSummaryPageSchema,
  bookSummarySchema,
  bookViewStatsSchema,
  filtersDataSchema,
  likeResultSchema,
  type AdminBooksData,
  type BookDetail,
  type BookForAdmin,
  type BookSummary,
  type BookSummaryPage,
  type BookViewStats,
  type FiltersData,
  type GetAdminBooksParams,
  type GetBooksParams,
  type LikeResult,
  type UpdateBookParams,
} from '../schemas/book.schema';

export async function getBookBySlug(bookSlug: string): Promise<BookDetail> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.getBookBySlug(bookSlug),
    method: 'GET',
  });
  return bookDetailSchema.parse(payload);
}

export async function getBooks(
  params?: GetBooksParams,
  signal?: AbortSignal,
): Promise<BookSummaryPage> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.getBooks,
    method: 'GET',
    params,
    signal,
  });
  return bookSummaryPageSchema.parse(payload);
}

export async function getFilters(): Promise<FiltersData> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.getFilters,
    method: 'GET',
  });
  return filtersDataSchema.parse(payload);
}

export async function getAdminBooks(
  params?: GetAdminBooksParams,
): Promise<AdminBooksData> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.getAllBookForAdmin,
    method: 'GET',
    params,
  });
  return bookAdminPageSchema.parse(payload);
}

export async function getBookById(bookId: string): Promise<BookForAdmin> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.getBookById(bookId),
    method: 'GET',
  });
  return bookAdminSchema.parse(payload);
}

export async function getBookStats(bookId: string): Promise<BookViewStats> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.getBookStats(bookId),
    method: 'GET',
  });
  return bookViewStatsSchema.parse(payload);
}

export async function getTrendingSearches(): Promise<string[]> {
  const payload = await apiRequest<unknown>({
    url: '/search/trending-keywords',
    method: 'GET',
  });
  return z.array(z.string()).parse(payload);
}

export async function getTopReadBooks(params: {
  timeRange: string;
  limit?: number;
}): Promise<BookSummary[]> {
  const payload = await apiRequest<unknown>({
    url: '/books/top-read',
    method: 'GET',
    params,
  });
  return z.array(bookSummarySchema).parse(payload);
}

export async function createBook(formData: FormData): Promise<BookForAdmin> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.createBook,
    method: 'POST',
    data: formData,
  });
  return bookAdminSchema.parse(payload);
}

export async function updateBook({
  bookId,
  formData,
}: UpdateBookParams): Promise<BookForAdmin> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.updateBook(bookId),
    method: 'PUT',
    data: formData,
  });
  return bookAdminSchema.parse(payload);
}

export async function deleteBook(bookId: string): Promise<void> {
  await apiRequest<void>({
    url: NESTJS_BOOKS_ENDPOINTS.deleteBook(bookId),
    method: 'DELETE',
  });
}

export async function toggleLikeBook(bookSlug: string): Promise<LikeResult> {
  const payload = await apiRequest<unknown>({
    url: NESTJS_BOOKS_ENDPOINTS.like(bookSlug),
    method: 'PATCH',
  });
  return likeResultSchema.parse(payload);
}

export async function recordBookView(bookSlug: string): Promise<void> {
  await apiRequest<void>({
    url: NESTJS_BOOKS_ENDPOINTS.recordView(bookSlug),
    method: 'POST',
  });
}

export async function recordSearchKeyword(keyword: string): Promise<void> {
  await apiRequest<void>({
    url: '/search/record',
    method: 'POST',
    data: { keyword },
  });
}