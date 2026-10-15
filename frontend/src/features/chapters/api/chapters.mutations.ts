import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterKeys } from '@/lib/query-keys';
import {
  askChapterAI,
  createChapter,
  deleteChapter,
  generateChapterKnowledge,
  importChaptersPreview,
  recordChapterView,
  startChaptersImport,
  updateChapter,
} from './chapters.api';
import type {
  Chapter,
  ChapterPreview,
  ChapterKnowledge,
  CreateChapterParams,
  DeleteChapterParams,
  GenerateChapterKnowledgeParams,
  ImportChaptersParams,
  RecordChapterViewParams,
  StartChaptersImportParams,
  StartChaptersImportResponse,
  UpdateChapterParams,
} from '../types/chapter.interface';

export function useRecordChapterView() {
  return useMutation<void, Error, RecordChapterViewParams>({
    mutationFn: recordChapterView,
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation<Chapter, Error, CreateChapterParams>({
    mutationFn: createChapter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();
  return useMutation<Chapter, Error, UpdateChapterParams>({
    mutationFn: updateChapter,
    onSuccess: (_data, { bookSlug, chapterId }) => {
      queryClient.invalidateQueries({
        queryKey: chapterKeys.byId(bookSlug, chapterId),
      });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, DeleteChapterParams>({
    mutationFn: deleteChapter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
  });
}

export function useImportChaptersPreview() {
  return useMutation<ChapterPreview[], Error, ImportChaptersParams>({
    mutationFn: importChaptersPreview,
  });
}

export function useStartChaptersImport() {
  return useMutation<StartChaptersImportResponse, Error, StartChaptersImportParams>(
    {
      mutationFn: startChaptersImport,
    },
  );
}

export function useAskChapterAI() {
  return useMutation<
    { answer: string; createdAt: string },
    Error,
    { bookSlug: string; chapterId: string; question: string }
  >({
    mutationFn: askChapterAI,
  });
}

export function useGenerateChapterKnowledge() {
  return useMutation<ChapterKnowledge, Error, GenerateChapterKnowledgeParams>({
    mutationFn: generateChapterKnowledge,
  });
}
