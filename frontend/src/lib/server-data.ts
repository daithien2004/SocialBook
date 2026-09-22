import { cacheLife } from 'next/cache';
import { NESTJS_BOOKS_ENDPOINTS } from '@/constants/server-endpoints';
import { NESTJS_CHAPTERS_ENDPOINTS } from '@/constants/server-endpoints';
import { serverApiRequest } from '@/lib/nestjs-server-api';
import type { Book } from '@/features/books/types/book.interface';
import type { ChapterDetailData } from '@/features/chapters/types/chapter.interface';

export async function fetchBookBySlugServer(slug: string): Promise<Book> {
  'use cache';
  cacheLife('hours');
  return serverApiRequest<Book>(NESTJS_BOOKS_ENDPOINTS.getBookBySlug(slug));
}

export async function fetchChapterDetailServer(
  bookSlug: string,
  chapterSlug: string,
): Promise<ChapterDetailData> {
  'use cache';
  cacheLife('hours');
  return serverApiRequest<ChapterDetailData>(
    NESTJS_CHAPTERS_ENDPOINTS.getChapterBySlug(bookSlug, chapterSlug),
  );
}