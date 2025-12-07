import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_CHAPTERS_ENDPOINTS } from '@/src/constants/client-endpoints';
import { Chapter } from '../types/chapter.interface';
import { Book } from '../../books/types/book.interface';

interface GetChapterRequest {
  bookSlug: string;
  chapterSlug: string;
}

interface GetChapterResponse {
  book: Book;
  chapter: Chapter;
  navigation: {
    previous: ChapterNavigation | null;
    next: ChapterNavigation | null;
  };
}

interface ChapterNavigation {
  id: string;
  title: string;
  slug: string;
  orderIndex: number;
}

interface GetChaptersRequest {
  bookSlug: string;
}

interface GetChaptersResponse {
  book: Partial<Book>;
  chapters: Chapter[];
  total: number;
}

interface CreateChapterRequest {
  bookSlug: string;
  data: {
    title: string;
    paragraphs: { id: string; content: string }[];
    slug?: string;
  };
}

interface UpdateChapterRequest {
  bookSlug: string;
  chapterId: string;
  data: {
    title?: string;
    paragraphs?: { id: string; content: string }[];
    slug?: string;
  };
}

export const chaptersApi = createApi({
  reducerPath: 'chapterApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Chapters', 'Chapter'],
  endpoints: (builder) => ({
    getChapter: builder.query<GetChapterResponse, GetChapterRequest>({
      query: (data) => ({
        url: BFF_CHAPTERS_ENDPOINTS.getChapterBySlug(
          data.bookSlug,
          data.chapterSlug
        ),
        method: 'GET',
      }),
      providesTags: (result, error, arg) => [
        { type: 'Chapter', id: arg.chapterSlug },
      ],
    }),

    getChapters: builder.query<GetChaptersResponse, GetChaptersRequest>({
      query: (data) => ({
        url: BFF_CHAPTERS_ENDPOINTS.getChapters(data.bookSlug),
        method: 'GET',
      }),
      providesTags: ['Chapters'],
    }),

    // Admin endpoints
    getAdminChapters: builder.query<GetChaptersResponse, GetChaptersRequest>({
      query: (data) => ({
        url: `/admin/books/${data.bookSlug}/chapters`,
        method: 'GET',
      }),
      providesTags: ['Chapters'],
    }),

    getChapterById: builder.query<Chapter, { bookSlug: string; chapterId: string }>({
      query: ({ bookSlug, chapterId }) => ({
        url: BFF_CHAPTERS_ENDPOINTS.getChapterById(bookSlug, chapterId),
        method: 'GET',
      }),
      providesTags: (result, error, { chapterId }) => [
        { type: 'Chapter', id: chapterId },
      ],
    }),

    createChapter: builder.mutation<Chapter, CreateChapterRequest>({
      query: ({ bookSlug, data }) => ({
        url: BFF_CHAPTERS_ENDPOINTS.createChapter(bookSlug),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chapters'],
    }),

    updateChapter: builder.mutation<Chapter, UpdateChapterRequest>({
      query: ({ bookSlug, chapterId, data }) => ({
        url: BFF_CHAPTERS_ENDPOINTS.updateChapter(bookSlug, chapterId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: 'Chapter', id: chapterId },
        'Chapters',
      ],
    }),

    deleteChapter: builder.mutation<void, { bookSlug: string; chapterId: string }>({
      query: ({ bookSlug, chapterId }) => ({
        url: BFF_CHAPTERS_ENDPOINTS.deleteChapter(bookSlug, chapterId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Chapters'],
    }),

    importChaptersPreview: builder.mutation<{ title: string; content: string }[], { bookSlug: string; formData: FormData }>({
      query: ({ bookSlug, formData }) => ({
        url: BFF_CHAPTERS_ENDPOINTS.importChapter(bookSlug),
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
