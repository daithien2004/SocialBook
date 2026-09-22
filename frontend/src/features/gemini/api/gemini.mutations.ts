import { useMutation } from '@tanstack/react-query';
import { summarizeChapter } from './gemini.api';
import type { SummarizeChapterResponse } from './gemini.api';

export function useSummarizeChapter() {
  return useMutation<
    SummarizeChapterResponse,
    Error,
    { chapterId: string; userId?: string }
  >({
    mutationFn: summarizeChapter,
  });
}