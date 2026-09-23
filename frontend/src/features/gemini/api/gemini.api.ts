import { NESTJS_GEMINI_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/nestjs-client-api';

export interface SummarizeChapterResponse {
  summary: string;
  requestId: string;
  chapterId: string;
  summaryLength: number;
}

export function summarizeChapter(params: {
  chapterId: string;
}): Promise<SummarizeChapterResponse> {
  return apiRequest<SummarizeChapterResponse>({
    url: NESTJS_GEMINI_ENDPOINTS.summarizeChapter(params.chapterId),
    method: 'POST',
  });
}