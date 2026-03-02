import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_TTS_ENDPOINTS } from '@/constants/server-endpoints';

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

export const ttsApi = createApi({
    reducerPath: 'ttsApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['TTS', 'Chapters'],
    endpoints: (builder) => ({
        // Generate audio for a single chapter
        generateChapterAudio: builder.mutation<
            TTSAudio,
            { chapterId: string; options?: GenerateAudioOptions }
        >({
            query: ({ chapterId, options = {} }) => ({
                url: NESTJS_TTS_ENDPOINTS.generateChapter(chapterId),
                method: 'POST',
                body: options,
            }),
            invalidatesTags: (result, error, { chapterId }) => {
                // Only invalidate if successful
                if (!error && result) {
                    return [
                        { type: 'TTS', id: chapterId },
                        { type: 'TTS', id: 'LIST' },
                        { type: 'Chapters', id: 'LIST' },
                    ];
                }
                return [];
            },
        }),

        // Generate audio for all chapters in a book
        generateBookAudio: builder.mutation<
            GenerateBookAudioResponse,
            { bookId: string; options?: GenerateAudioOptions }
        >({
            query: ({ bookId, options = {} }) => ({
                url: NESTJS_TTS_ENDPOINTS.generateBook(bookId),
                method: 'POST',
                body: options,
            }),
            invalidatesTags: [
                { type: 'TTS', id: 'LIST' },
                { type: 'Chapters', id: 'LIST' },
            ],
        }),

        // Get TTS audio by chapter ID
        getChapterAudio: builder.query<TTSAudio | null, string>({
            query: (chapterId) => ({
                url: NESTJS_TTS_ENDPOINTS.getByChapter(chapterId),
                method: 'GET',
            }),
            providesTags: (result, error, chapterId) => [
                { type: 'TTS', id: chapterId },
            ],
        }),

        // Delete TTS audio for a chapter
        deleteChapterAudio: builder.mutation<void, string>({
            query: (chapterId) => ({
                url: NESTJS_TTS_ENDPOINTS.delete(chapterId),
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, chapterId) => [
                { type: 'TTS', id: chapterId },
                { type: 'TTS', id: 'LIST' },
            ],
        }),

        // Increment play count
        incrementPlayCount: builder.mutation<void, string>({
            query: (chapterId) => ({
                url: NESTJS_TTS_ENDPOINTS.incrementPlay(chapterId),
                method: 'POST',
            }),
            // Don't invalidate tags for play count - no need to refetch
        }),
    }),
});

export const {
    useGenerateChapterAudioMutation,
    useGenerateBookAudioMutation,
    useGetChapterAudioQuery,
    useLazyGetChapterAudioQuery,
    useDeleteChapterAudioMutation,
    useIncrementPlayCountMutation,
} = ttsApi;
