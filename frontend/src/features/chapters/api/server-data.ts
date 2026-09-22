import { cacheLife } from 'next/cache';
import { NESTJS_CHAPTERS_ENDPOINTS } from '@/constants/server-endpoints';
import { serverApiRequest } from '@/lib/nestjs-server-api';
import type { ChapterDetailData } from '../types/chapter.interface';

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