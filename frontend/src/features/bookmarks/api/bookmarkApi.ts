import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string;
  chapterSlug: string;
  paragraphId: string;
  textPreview: string;
}

export interface CreateBookmarkRequest {
  bookId: string;
  chapterId: string;
  chapterSlug: string;
  paragraphId: string;
  textPreview: string;
}

export const bookmarkApi = createApi({
  reducerPath: 'bookmarkApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Bookmark'],
  endpoints: (builder) => ({
    getBookmarksByBook: builder.query<Bookmark[], string>({
      query: (bookId: string) => ({
        url: `/bookmarks/book/${bookId}`,
        method: 'GET',
      }),
      providesTags: (result, error, bookId: string) => [{ type: 'Bookmark', id: bookId }],
    }),
    createBookmark: builder.mutation<Bookmark, CreateBookmarkRequest>({
      query: (body: CreateBookmarkRequest) => ({
        url: '/bookmarks',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg: CreateBookmarkRequest) => [{ type: 'Bookmark', id: arg.bookId }],
    }),
    deleteBookmark: builder.mutation<void, { paragraphId: string; bookId: string }>({
      query: ({ paragraphId }: { paragraphId: string; bookId: string }) => ({
        url: `/bookmarks/${paragraphId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg: { paragraphId: string; bookId: string }) => [{ type: 'Bookmark', id: arg.bookId }],
    }),
  }),
});

export const {
  useGetBookmarksByBookQuery,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
} = bookmarkApi;
