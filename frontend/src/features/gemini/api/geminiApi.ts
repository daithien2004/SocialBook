import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_GEMINI_ENDPOINTS } from '@/src/constants/client-endpoints';

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    summarizeChapter: builder.mutation<string, string>({
      query: (chapterId) => ({
        url: BFF_GEMINI_ENDPOINTS.summarizeChapter(chapterId),
        method: 'POST',
      }),
    }),
  }),
});

export const { useSummarizeChapterMutation } = geminiApi;
