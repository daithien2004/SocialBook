import { NESTJS_BOOKS_ENDPOINTS } from '@/constants/server-endpoints';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { createApi } from '@reduxjs/toolkit/query/react';
import { buildListTags, buildUpdateBookInvalidationTags } from '../books.helpers';
import { AdminBooksData, Book, BookForAdmin, BookStats, FiltersData, GetAdminBooksParams, GetBookParams, GetBooksParams, LikeResult, PaginatedData, UpdateBookParams } from '../types/book.interface';

export const BOOK_TAGS = {
  BOOKS: 'Books',
  BOOK_DETAIL: 'BookDetail',
  ADMIN_BOOKS: 'AdminBooks',
  BOOK_STATS: 'BookStats',
  TRENDING_SEARCHES: 'TrendingSearches',
} as const;

export type BookTagType = typeof BOOK_TAGS[keyof typeof BOOK_TAGS];

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: Object.values(BOOK_TAGS),
  endpoints: (builder) => ({
    getBookBySlug: builder.query<Book, GetBookParams>({
      query: (data) => {
        return {
          url: NESTJS_BOOKS_ENDPOINTS.getBookBySlug(data.bookSlug),
          method: 'GET',
        };
      },
      providesTags: (result, error, arg) => [
        { type: BOOK_TAGS.BOOK_DETAIL, id: arg.bookSlug },
      ],
    }),
    getBooks: builder.query<PaginatedData<Book>, GetBooksParams>({
      query: (params) => ({
        url: NESTJS_BOOKS_ENDPOINTS.getBooks,
        method: 'GET',
        params: params,
      }),
      providesTags: (result) =>
        buildListTags(result?.data, BOOK_TAGS.BOOKS, 'slug'),
    }),

    getFilters: builder.query<FiltersData, void>({
      query: () => ({
        url: NESTJS_BOOKS_ENDPOINTS.getFilters,
        method: 'GET',
      }),
    }),

    createBook: builder.mutation<Book, FormData>({
      query: (formData) => ({
        url: NESTJS_BOOKS_ENDPOINTS.createBook,
        method: 'POST',
        body: formData,
      }),

      invalidatesTags: [
        { type: BOOK_TAGS.BOOKS, id: 'LIST' },
        { type: BOOK_TAGS.ADMIN_BOOKS, id: 'LIST' },
      ],
    }),

    getAdminBooks: builder.query<
      AdminBooksData,
      GetAdminBooksParams
    >({
      query: (params) => ({
        url: NESTJS_BOOKS_ENDPOINTS.getAllBookForAdmin,
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        buildListTags(result?.data, BOOK_TAGS.ADMIN_BOOKS, 'id'),
    }),

    getBookById: builder.query<BookForAdmin, string>({
      query: (bookId) => ({
        url: NESTJS_BOOKS_ENDPOINTS.getBookById(bookId),
        method: 'GET',
      }),
      providesTags: (result, error, bookId) => [
        { type: BOOK_TAGS.ADMIN_BOOKS, id: bookId },
      ],
    }),

    getBookStats: builder.query<BookStats, string>({
      query: (bookId) => ({
        url: NESTJS_BOOKS_ENDPOINTS.getBookStats(bookId),
        method: 'GET',
      }),
      providesTags: (result, error, bookId) => [
        { type: BOOK_TAGS.BOOK_STATS, id: bookId },
      ],
    }),

    updateBook: builder.mutation<
      BookForAdmin,
      UpdateBookParams
    >({
      query: ({ bookId, formData }) => ({
        url: NESTJS_BOOKS_ENDPOINTS.updateBook(bookId),
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { bookId }) =>
        buildUpdateBookInvalidationTags(result, bookId),
    }),

    deleteBook: builder.mutation<void, string>({
      query: (bookId) => ({
        url: NESTJS_BOOKS_ENDPOINTS.deleteBook(bookId),
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: BOOK_TAGS.ADMIN_BOOKS, id: 'LIST' },
        { type: BOOK_TAGS.BOOKS, id: 'LIST' },
      ],
    }),

    likeBook: builder.mutation<LikeResult, string>({
      query: (bookSlug) => ({
        url: NESTJS_BOOKS_ENDPOINTS.like(bookSlug),
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: BOOK_TAGS.BOOKS, id: 'LIST' },
      ],
    }),

    recordView: builder.mutation<void, string>({
      query: (bookSlug) => ({
        url: NESTJS_BOOKS_ENDPOINTS.recordView(bookSlug),
        method: 'POST',
      }),
    }),

    getTrendingSearches: builder.query<string[], void>({
      query: () => ({
        url: '/search/trending-keywords',
        method: 'GET',
      }),
      providesTags: [BOOK_TAGS.TRENDING_SEARCHES],
    }),

    getTopReadBooks: builder.query<Book[], { timeRange: string; limit?: number }>({
      query: (params) => ({
        url: '/books/top-read',
        method: 'GET',
        params,
      }),
    }),

    recordSearchKeyword: builder.mutation<void, string>({
      query: (keyword) => ({
        url: '/search/record',
        method: 'POST',
        body: { keyword },
      }),
      invalidatesTags: [BOOK_TAGS.TRENDING_SEARCHES],
    }),
  }),
});

export const {
  useGetBooksQuery,
  useLazyGetBooksQuery,
  useGetBookBySlugQuery,
  useCreateBookMutation,
  useGetAdminBooksQuery,
  useGetBookByIdQuery,
  useGetBookStatsQuery,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useLikeBookMutation,
  useRecordViewMutation,
  useGetFiltersQuery,
  useGetTrendingSearchesQuery,
  useGetTopReadBooksQuery,
  useRecordSearchKeywordMutation,
} = booksApi;
