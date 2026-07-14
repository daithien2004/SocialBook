import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { createApi } from '@reduxjs/toolkit/query/react';
import { UserHighlight, CreateUserHighlightPayload, UpdateUserHighlightPayload } from '../types/user-highlight.interface';

export const USER_HIGHLIGHTS_TAGS = {
  HIGHLIGHTS: 'UserHighlights',
} as const;

export const userHighlightsApi = createApi({
  reducerPath: 'userHighlightsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: Object.values(USER_HIGHLIGHTS_TAGS),
  endpoints: (builder) => ({
    getHighlightsByBook: builder.query<UserHighlight[], string>({
      query: (bookId) => ({
        url: `/user-highlights/book/${bookId}`,
        method: 'GET',
      }),
      providesTags: (result, error, bookId) => [
        { type: USER_HIGHLIGHTS_TAGS.HIGHLIGHTS, id: `BOOK_${bookId}` },
      ],
    }),
    getHighlightsByChapter: builder.query<UserHighlight[], string>({
      query: (chapterId) => ({
        url: `/user-highlights/chapter/${chapterId}`,
        method: 'GET',
      }),
      providesTags: (result, error, chapterId) => [
        { type: USER_HIGHLIGHTS_TAGS.HIGHLIGHTS, id: `CHAPTER_${chapterId}` },
      ],
    }),
    createHighlight: builder.mutation<UserHighlight, CreateUserHighlightPayload>({
      query: (payload) => ({
        url: '/user-highlights',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: USER_HIGHLIGHTS_TAGS.HIGHLIGHTS, id: `BOOK_${arg.bookId}` },
        { type: USER_HIGHLIGHTS_TAGS.HIGHLIGHTS, id: `CHAPTER_${arg.chapterId}` },
      ],
    }),
    updateHighlight: builder.mutation<UserHighlight, UpdateUserHighlightPayload>({
      query: ({ id, ...payload }) => ({
        url: `/user-highlights/${id}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: [USER_HIGHLIGHTS_TAGS.HIGHLIGHTS],
    }),
    deleteHighlight: builder.mutation<void, string>({
      query: (id) => ({
        url: `/user-highlights/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [USER_HIGHLIGHTS_TAGS.HIGHLIGHTS],
    }),
  }),
});

export const {
  useGetHighlightsByBookQuery,
  useGetHighlightsByChapterQuery,
  useCreateHighlightMutation,
  useUpdateHighlightMutation,
  useDeleteHighlightMutation,
} = userHighlightsApi;
