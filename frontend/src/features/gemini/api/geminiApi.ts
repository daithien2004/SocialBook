import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_GEMINI_ENDPOINTS } from '@/constants/server-endpoints';

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    summarizeChapter: builder.mutation<string, { chapterId: string; userId?: string }>({
      query: ({ chapterId, userId }) => ({
        url: NESTJS_GEMINI_ENDPOINTS.summarizeChapter(chapterId),
        method: 'POST',
        body: { userId },
      }),
    }),
  }),
});

export const { useSummarizeChapterMutation } = geminiApi;
