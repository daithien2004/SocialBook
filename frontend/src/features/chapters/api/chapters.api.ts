import { NESTJS_CHAPTERS_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/api-client';
import type { PaginationMeta } from '@/lib/api-response';
import type {
  Chapter,
  ChapterDetailData,
  ChapterKnowledge,
  ChapterPreview,
  ChaptersImportStatus,
  ChaptersListData,
  CreateChapterParams,
  DeleteChapterParams,
  GetChapterByIdParams,
  GetChapterKnowledgeParams,
  GetChapterParams,
  GetChaptersImportStatusParams,
  GetChaptersParams,
  ImportChaptersParams,
  RecordChapterViewParams,
  StartChaptersImportParams,
  StartChaptersImportResponse,
  UpdateChapterParams,
} from '../types/chapter.interface';

export const CHAPTER_TAGS = {
  CHAPTERS: 'Chapters',
  CHAPTER: 'Chapter',
} as const;

export type ChapterTagType = (typeof CHAPTER_TAGS)[keyof typeof CHAPTER_TAGS];



export function getChapter(params: GetChapterParams): Promise<ChapterDetailData> {
  return apiRequest<ChapterDetailData>({
    url: NESTJS_CHAPTERS_ENDPOINTS.getChapterBySlug(
      params.bookSlug,
      params.chapterSlug,
    ),
    method: 'GET',
  });
}

export function recordChapterView(
  params: RecordChapterViewParams,
): Promise<void> {
  return apiRequest<void>({
    url: NESTJS_CHAPTERS_ENDPOINTS.recordChapterView(
      params.bookSlug,
      params.chapterSlug,
    ),
    method: 'POST',
  });
}

const fetchChapters = async (
  params: GetChaptersParams,
): Promise<ChaptersListData> => {
  const response = await apiRequest<{ data?: Chapter[]; meta?: PaginationMeta } | Chapter[] | { chapters?: Chapter[]; meta?: PaginationMeta }>({
    url: NESTJS_CHAPTERS_ENDPOINTS.getChapters(params.bookSlug),
    method: 'GET',
    params: {
      page: params.page,
      limit: params.limit,
    },
  });

  if (Array.isArray(response)) {
    return { chapters: response, total: response.length };
  }

  const chaptersData = 'data' in response ? response.data : ('chapters' in response ? response.chapters : []);
  return {
    chapters: chaptersData || [],
    total: response.meta?.total ?? chaptersData?.length ?? 0,
  };
};

export function getChapters(params: GetChaptersParams): Promise<ChaptersListData> {
  return fetchChapters(params);
}

export function getAdminChapters(
  params: GetChaptersParams,
): Promise<ChaptersListData> {
  return fetchChapters(params);
}

export function getChapterById(params: GetChapterByIdParams): Promise<Chapter> {
  return apiRequest<Chapter>({
    url: NESTJS_CHAPTERS_ENDPOINTS.getChapterById(
      params.bookSlug,
      params.chapterId,
    ),
    method: 'GET',
  });
}

export function createChapter(params: CreateChapterParams): Promise<Chapter> {
  return apiRequest<Chapter>({
    url: NESTJS_CHAPTERS_ENDPOINTS.createChapter(params.bookSlug),
    method: 'POST',
    data: params.data,
  });
}

export function updateChapter(params: UpdateChapterParams): Promise<Chapter> {
  return apiRequest<Chapter>({
    url: NESTJS_CHAPTERS_ENDPOINTS.updateChapter(params.bookSlug, params.chapterId),
    method: 'PUT',
    data: params.data,
  });
}

export function deleteChapter(params: DeleteChapterParams): Promise<void> {
  return apiRequest<void>({
    url: NESTJS_CHAPTERS_ENDPOINTS.deleteChapter(params.bookSlug, params.chapterId),
    method: 'DELETE',
  });
}

export async function importChaptersPreview(
  params: ImportChaptersParams,
): Promise<ChapterPreview[]> {
  const response = await apiRequest<{
    chapters: ChapterPreview[];
    totalChapters: number;
  }>({
    url: NESTJS_CHAPTERS_ENDPOINTS.importPreview(params.bookSlug),
    method: 'POST',
    data: params.formData,
  });
  return response.chapters;
}

export function startChaptersImport(
  params: StartChaptersImportParams,
): Promise<StartChaptersImportResponse> {
  return apiRequest<StartChaptersImportResponse>({
    url: NESTJS_CHAPTERS_ENDPOINTS.importStart(params.bookSlug),
    method: 'POST',
    data: params.data,
  });
}

export function getChaptersImportStatus(
  params: GetChaptersImportStatusParams,
): Promise<ChaptersImportStatus> {
  return apiRequest<ChaptersImportStatus>({
    url: NESTJS_CHAPTERS_ENDPOINTS.importStatus(params.bookSlug, params.jobId),
    method: 'GET',
    params: params.timestamp ? { t: params.timestamp } : undefined,
  });
}

export function getChapterKnowledge(
  params: GetChapterKnowledgeParams,
): Promise<ChapterKnowledge> {
  return apiRequest<ChapterKnowledge>({
    url: NESTJS_CHAPTERS_ENDPOINTS.getChapterKnowledge(
      params.bookSlug,
      params.chapterId,
    ),
    method: 'GET',
    params: { force: params.force ? 'true' : undefined },
  });
}

export function askChapterAI(params: {
  bookSlug: string;
  chapterId: string;
  question: string;
}): Promise<{ answer: string; createdAt: string }> {
  return apiRequest<{ answer: string; createdAt: string }>({
    url: `${NESTJS_CHAPTERS_ENDPOINTS.getChapters(params.bookSlug)}/${params.chapterId}/ask-ai`,
    method: 'POST',
    data: { question: params.question },
  });
}