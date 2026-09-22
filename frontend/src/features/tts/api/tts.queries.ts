import { ttsKeys } from '@/lib/query-keys';
import { getChapterAudio } from './tts.api';
import type { TTSAudio } from './tts.api';

export const ttsQueries = {
  audio: (chapterId: string) => ({
    queryKey: ttsKeys.byChapter(chapterId),
    queryFn: (): Promise<TTSAudio | null> => getChapterAudio(chapterId),
  }),
};