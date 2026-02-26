import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_CHAPTERS_ENDPOINTS } from '@/constants/server-endpoints';
import { Chapter, ChapterDetailData, ChapterPreview, ChaptersListData, CreateChapterParams, DeleteChapterParams, GetChapterByIdParams, GetChapterParams, GetChaptersParams, ImportChaptersParams, UpdateChapterParams } from '../types/chapter.interface';

export const CHAPTER_TAGS = {
  CHAPTERS: 'Chapters',
  CHAPTER: 'Chapter',
} as const;

export type ChapterTagType = typeof CHAPTER_TAGS[keyof typeof CHAPTER_TAGS];

export const chaptersApi = createApi({
  reducerPath: 'chaptersApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: Object.values(CHAPTER_TAGS),
  endpoints: (builder) => ({
    getChapter: builder.query<ChapterDetailData, GetChapterParams>({
      query: (params) => ({
        url: NESTJS_CHAPTERS_ENDPOINTS.getChapterBySlug(
          params.bookSlug,
          params.chapterSlug
        ),
        method: 'GET',
      }),
      providesTags: (result, error, params) => [
        { type: CHAPTER_TAGS.CHAPTER, id: params.chapterSlug },
      ],
    }),

    getChapters: builder.query<ChaptersListData, GetChaptersParams>({
      query: (params) => ({
        url: NESTJS_CHAPTERS_ENDPOINTS.getChapters(params.bookSlug),
        method: 'GET',
        params: {
          page: params.page,
          limit: params.limit
        }
      }),
      transformResponse: (response: unknown): ChaptersListData => {
        const objResponse = response as { book?: any, chapters?: Chapter[], data?: Chapter[], meta?: any };

        if (objResponse?.chapters && Array.isArray(objResponse.chapters)) {
          return {
            chapters: objResponse.chapters,
            total: objResponse.meta?.total ?? objResponse.chapters.length,
            book: objResponse.book || {}
          };
        }

        if (objResponse?.data && Array.isArray(objResponse.data)) {
          return {
            chapters: objResponse.data,
            total: objResponse.meta?.total ?? objResponse.data.length,
            book: {}
          };
        }

        if (Array.isArray(response)) {
          return {
            chapters: response as Chapter[],
            total: (response as Chapter[]).length,
            book: {}
          };
        }

        return { chapters: [], total: 0, book: {} };
      },
      providesTags: [{ type: CHAPTER_TAGS.CHAPTERS, id: 'LIST' }],
    }),

    getAdminChapters: builder.query<ChaptersListData, GetChaptersParams>({
      query: (params) => ({
        url: NESTJS_CHAPTERS_ENDPOINTS.getChapters(params.bookSlug),
        method: 'GET',
        params: {
          page: params.page,
          limit: params.limit
        }
      }),
      transformResponse: (response: unknown): ChaptersListData => {
        // AxiosBaseQuery extracts response.data. In case of { book, chapters }
        const objResponse = response as { book?: any, chapters?: Chapter[], data?: Chapter[], meta?: any };

        if (objResponse?.chapters && Array.isArray(objResponse.chapters)) {
          return {
            chapters: objResponse.chapters,
            total: objResponse.meta?.total ?? objResponse.chapters.length,
            book: objResponse.book || {}
          };
        }

        // Response từ axiosBaseQuery khi có meta: { data: Chapter[], meta: PaginationMeta }
        if (objResponse?.data && Array.isArray(objResponse.data)) {
          return {
            chapters: objResponse.data,
            total: objResponse.meta?.total ?? objResponse.data.length,
            book: {}
          };
        }

        // Fallback: response là array trực tiếp
        if (Array.isArray(response)) {
          return {
            chapters: response as Chapter[],
            total: (response as Chapter[]).length,
            book: {}
          };
        }

        // Default empty state
        return { chapters: [], total: 0, book: {} };
      },
      providesTags: [{ type: CHAPTER_TAGS.CHAPTERS, id: 'LIST' }],
    }),

    getChapterById: builder.query<Chapter, GetChapterByIdParams>({
      query: ({ bookSlug, chapterId }) => ({
        url: NESTJS_CHAPTERS_ENDPOINTS.getChapterById(bookSlug, chapterId),
        method: 'GET',
      }),
      providesTags: (result, error, { chapterId }) => [
        { type: CHAPTER_TAGS.CHAPTER, id: chapterId },
      ],
    }),

    createChapter: builder.mutation<Chapter, CreateChapterParams>({
      query: ({ bookSlug, data }) => ({
        url: NESTJS_CHAPTERS_ENDPOINTS.createChapter(bookSlug),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: CHAPTER_TAGS.CHAPTERS, id: 'LIST' }],
    }),

    updateChapter: builder.mutation<Chapter, UpdateChapterParams>({
      query: ({ bookSlug, chapterId, data }) => ({
        url: NESTJS_CHAPTERS_ENDPOINTS.updateChapter(bookSlug, chapterId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: CHAPTER_TAGS.CHAPTER, id: chapterId },
        { type: CHAPTER_TAGS.CHAPTERS, id: 'LIST' },
      ],
    }),

    deleteChapter: builder.mutation<void, DeleteChapterParams>({
      query: ({ bookSlug, chapterId }) => ({
        url: NESTJS_CHAPTERS_ENDPOINTS.deleteChapter(bookSlug, chapterId),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: CHAPTER_TAGS.CHAPTERS, id: 'LIST' }],
    }),

    importChaptersPreview: builder.mutation<ChapterPreview[],
      ImportChaptersParams>({
        query: ({ bookSlug, formData }) => ({
          url: NESTJS_CHAPTERS_ENDPOINTS.importPreview(bookSlug),
          method: 'POST',
          body: formData,
        }),
      }),
  }),
});

export const {
  useGetChapterQuery,
  useGetChaptersQuery,
  useGetAdminChaptersQuery,
  useGetChapterByIdQuery,
  useLazyGetChapterByIdQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useImportChaptersPreviewMutation,
} = chaptersApi;
