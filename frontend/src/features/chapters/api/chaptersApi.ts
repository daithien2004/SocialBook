import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_CHAPTERS_ENDPOINTS } from '@/src/constants/client-endpoints';
import { Chapter } from '../types/chapter.interface';

interface GetChapterRequest {
  bookSlug: string;
  chapterSlug: string;
}

interface GetChaptersRequest {
  bookSlug: string;
}

export const chaptersApi = createApi({
  reducerPath: 'chapterApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Chapters'],
  endpoints: (builder) => ({
    getChapter: builder.query<Chapter, GetChapterRequest>({
      query: (data) => ({
        url: BFF_CHAPTERS_ENDPOINTS.getChapter(data.bookSlug, data.chapterSlug),
        method: 'GET',
        body: data,
      }),
      providesTags: ['Chapters'],
    }),
    getChapters: builder.query<Chapter[], GetChaptersRequest>({
      query: (data) => ({
        url: BFF_CHAPTERS_ENDPOINTS.getChapters(data.bookSlug),
        method: 'GET',
        body: data,
      }),
      providesTags: ['Chapters'],
    }),
  }),
});

export const { useGetChapterQuery, useGetChaptersQuery } = chaptersApi;
