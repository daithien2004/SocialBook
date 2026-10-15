import { keepPreviousData } from '@tanstack/react-query';
import { chapterKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';
import {
  getAdminChapters,
  getChapter,
  getChapterById,
  getChapters,
  getChaptersImportStatus,
} from './chapters.api';
import type {
  Chapter,
  ChapterDetailData,
  ChaptersImportStatus,
  ChaptersListData,
  GetChapterByIdParams,
  GetChapterParams,
  GetChaptersImportStatusParams,
  GetChaptersParams,
} from '../types/chapter.interface';

export const chaptersQueries = {
  detail: (params: GetChapterParams) => ({
    queryKey: chapterKeys.detail(params.bookSlug, params.chapterSlug),
    queryFn: (): Promise<ChapterDetailData> => getChapter(params),
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
  list: (params: GetChaptersParams) => ({
    queryKey: chapterKeys.list(params),
    queryFn: (): Promise<ChaptersListData> => getChapters(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
  adminList: (params: GetChaptersParams) => ({
    queryKey: chapterKeys.adminList(params),
    queryFn: (): Promise<ChaptersListData> => getAdminChapters(params),
    placeholderData: keepPreviousData,
  }),
  byId: (params: GetChapterByIdParams) => ({
    queryKey: chapterKeys.byId(params.bookSlug, params.chapterId),
    queryFn: (): Promise<Chapter> => getChapterById(params),
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
  importStatus: (params: GetChaptersImportStatusParams) => ({
    queryKey: chapterKeys.importStatus(
      params.bookSlug,
      params.jobId,
      params.timestamp,
    ),
    queryFn: (): Promise<ChaptersImportStatus> =>
      getChaptersImportStatus(params),
    gcTime: 0,
  }),
};
