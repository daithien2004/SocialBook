import { cacheLife } from 'next/cache';
import { NESTJS_BOOKS_ENDPOINTS } from '@/constants/server-endpoints';
import { serverApiRequest } from '@/lib/api-server';
import type { Book } from '../types/book.interface';

export async function fetchBookBySlugServer(slug: string): Promise<Book> {
  'use cache';
  cacheLife('hours');
  return serverApiRequest<Book>(NESTJS_BOOKS_ENDPOINTS.getBookBySlug(slug));
}