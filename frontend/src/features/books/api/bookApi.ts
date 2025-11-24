import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_BOOKS_ENDPOINTS } from '@/src/constants/client-endpoints';
import { BackendPagination, Book, BookForAdmin } from '../types/book.interface';

type BookStatus = 'draft' | 'published' | 'completed';
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

interface GetBookRequest {
  bookSlug: string;
}

export interface AdminBooksResponse {
  books: BookForAdmin[];
  pagination: BackendPagination;
}

export interface BookStatsResponse {
  views: number;
  likes: number;
  chapters: number;
}

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Books', 'BookDetail', 'AdminBooks', 'BookStats'],
  endpoints: (builder) => ({
    getBookBySlug: builder.query<Book, GetBookRequest>({
      query: (data) => {
        return {
          url: BFF_BOOKS_ENDPOINTS.getBySlug(data.bookSlug),
          method: 'GET',
        };
      },
      providesTags: (result, error, arg) => [
        { type: 'BookDetail', id: arg.bookSlug },
      ],
    }),
    getBooks: builder.query<Book[], void>({
      query: () => ({
        url: BFF_BOOKS_ENDPOINTS.getAll,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((book) => ({
                type: 'Books' as const,
                id: book.slug,
              })),
              { type: 'Books', id: 'LIST' },
            ]
          : [{ type: 'Books', id: 'LIST' }],
    }),

    createBook: builder.mutation<Book, FormData>({
      query: (formData) => ({
        url: BFF_BOOKS_ENDPOINTS.createBook,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [
        { type: 'Books', id: 'LIST' },
        { type: 'AdminBooks', id: 'LIST' },
      ],
    }),

    getAdminBooks: builder.query<
      AdminBooksResponse,
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: BookStatus;
      }
    >({
      query: (params) => ({
        url: BFF_BOOKS_ENDPOINTS.getAllForAdmin,
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.books
          ? [
              ...result.books.map((book) => ({
                type: 'AdminBooks' as const,
                id: book.id,
              })),
              { type: 'AdminBooks', id: 'LIST' },
            ]
          : [{ type: 'AdminBooks', id: 'LIST' }],
    }),

    getBookById: builder.query<BookForAdmin, string>({
      query: (bookId) => ({
        url: BFF_BOOKS_ENDPOINTS.getById(bookId),
        method: 'GET',
      }),
      providesTags: (result, error, bookId) => [
        { type: 'AdminBooks', id: bookId },
      ],
    }),

    getBookStats: builder.query<BookStatsResponse, string>({
      query: (bookId) => ({
        url: BFF_BOOKS_ENDPOINTS.getBookStats(bookId),
        method: 'GET',
      }),
      providesTags: (result, error, bookId) => [
        { type: 'BookStats', id: bookId },
      ],
    }),

    updateBook: builder.mutation<
      BookForAdmin,
      { bookId: string; formData: FormData }
    >({
      query: ({ bookId, formData }) => ({
        url: BFF_BOOKS_ENDPOINTS.updateBook(bookId),
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { bookId }) => {
        const tags: {
          type: 'AdminBooks' | 'Books' | 'BookDetail';
          id: string;
        }[] = [
          { type: 'AdminBooks', id: bookId },
          { type: 'AdminBooks', id: 'LIST' },
          { type: 'Books', id: 'LIST' },
        ];

        if (result && (result as any).slug) {
          tags.push({ type: 'BookDetail', id: (result as any).slug });
        }

        return tags;
      },
    }),

    deleteBook: builder.mutation<void, string>({
      query: (bookId) => ({
        url: BFF_BOOKS_ENDPOINTS.deleteBook(bookId),
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AdminBooks', id: 'LIST' },
        { type: 'Books', id: 'LIST' },
      ],
    }),

    likeBook: builder.mutation<
      { slug: string; isLiked: boolean; likes: number },
      string
    >({
      query: (bookId) => ({
        url: BFF_BOOKS_ENDPOINTS.like(bookId),
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, bookId) => {
        const tags: { type: 'BookStats' | 'BookDetail'; id: string }[] = [
          { type: 'BookStats', id: bookId },
        ];

        if (result?.slug) {
          tags.push({ type: 'BookDetail', id: result.slug });
        }
        return tags;
      },
    }),
  }),
});

export const {
  useGetBooksQuery,
  useGetBookBySlugQuery,
  useCreateBookMutation,
  useGetAdminBooksQuery,
  useGetBookByIdQuery,
  useGetBookStatsQuery,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useLikeBookMutation,
} = booksApi;
