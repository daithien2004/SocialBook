import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterKeys, ttsKeys } from '@/lib/query-keys';
import {
  deleteChapterAudio,
  generateBookAudio,
  generateChapterAudio,
  incrementPlayCount,
} from './tts.api';
import type {
  GenerateAudioOptions,
  GenerateBookAudioResponse,
  TTSAudio,
} from './tts.api';

export function useGenerateChapterAudio() {
  const queryClient = useQueryClient();
  return useMutation<
    TTSAudio,
    Error,
    { chapterId: string; options?: GenerateAudioOptions }
  >({
    mutationFn: generateChapterAudio,
    onSuccess: (_data, { chapterId }) => {
      queryClient.invalidateQueries({ queryKey: ttsKeys.byChapter(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
  });
}

export function useGenerateBookAudio() {
  const queryClient = useQueryClient();
  return useMutation<
    GenerateBookAudioResponse,
    Error,
    { bookId: string; options?: GenerateAudioOptions }
  >({
    mutationFn: generateBookAudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ttsKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
  });
}

export function useDeleteChapterAudio() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteChapterAudio,
    onSuccess: (_data, chapterId) => {
      queryClient.invalidateQueries({ queryKey: ttsKeys.byChapter(chapterId) });
    },
  });
}

export function useIncrementPlayCount() {
  return useMutation<void, Error, string>({
    mutationFn: incrementPlayCount,
  });
}