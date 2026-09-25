import { NESTJS_TTS_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/api-client';

export interface TTSAudio {
  id: string;
  chapterId: string;
  bookId: string;
  audioUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioDuration?: number;
  audioFormat?: string;
  language: string;
  voice: string;
  characterCount?: number;
  paragraphCount?: number;
  playCount?: number;
  lastPlayedAt?: string;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
  message?: string;
}

export interface GenerateAudioOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  language?: string;
  format?: string;
  forceRegenerate?: boolean;
}

export interface GenerateBookAudioResponse {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ chapterId: string; error: string }>;
  generated: Array<{ chapterId: string; status: string; audioUrl: string }>;
}

export function generateChapterAudio(params: {
  chapterId: string;
  options?: GenerateAudioOptions;
}): Promise<TTSAudio> {
  return apiRequest<TTSAudio>({
    url: NESTJS_TTS_ENDPOINTS.generateChapter(params.chapterId),
    method: 'POST',
    data: params.options ?? {},
  });
}

export function generateBookAudio(params: {
  bookId: string;
  options?: GenerateAudioOptions;
}): Promise<GenerateBookAudioResponse> {
  return apiRequest<GenerateBookAudioResponse>({
    url: NESTJS_TTS_ENDPOINTS.generateBook(params.bookId),
    method: 'POST',
    data: params.options ?? {},
  });
}

export function getChapterAudio(chapterId: string): Promise<TTSAudio | null> {
  return apiRequest<TTSAudio | null>({
    url: NESTJS_TTS_ENDPOINTS.getByChapter(chapterId),
    method: 'GET',
  });
}

export function deleteChapterAudio(chapterId: string): Promise<void> {
  return apiRequest<void>({
    url: NESTJS_TTS_ENDPOINTS.delete(chapterId),
    method: 'DELETE',
  });
}

export function incrementPlayCount(chapterId: string): Promise<void> {
  return apiRequest<void>({
    url: NESTJS_TTS_ENDPOINTS.incrementPlay(chapterId),
    method: 'POST',
  });
}