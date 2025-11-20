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

interface GetBooksResponse {
  total: string;
  books: Book[];
}

export interface AdminBooksResponse {
  books: BookForAdmin[];
  pagination: BackendPagination;
}

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Books', 'Book', 'AdminBooks'],
  endpoints: (builder) => ({
    getBookBySlug: builder.query<Book, GetBookRequest>({
      query: (data) => {
        return {
          url: BFF_BOOKS_ENDPOINTS.getBySlug(data.bookSlug),
          method: 'GET',
        };
      },
      providesTags: (result, error, arg) => [
        { type: 'Book', id: arg.bookSlug },
      ],
    }),
    getBooks: builder.query<GetBooksResponse, void>({
      query: () => ({
        url: BFF_BOOKS_ENDPOINTS.getAll,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.books.map((book) => ({
              type: 'Book' as const,
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
      invalidatesTags: [{ type: 'Books', id: 'LIST' }],
    }),

    getAdminBooks: builder.query<AdminBooksResponse, {
      page?: number;
      limit?: number;
      search?: string;
      status?: BookStatus;
    }>({
      query: (params) => ({
        url: BFF_BOOKS_ENDPOINTS.getAllForAdmin,
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result?.books
          ? [
            ...result.books.map((book: BookForAdmin) => ({
              type: 'AdminBooks' as const,
              id: book.id,
            })),
            { type: 'AdminBooks', id: 'LIST' },
          ]
          : [{ type: 'AdminBooks', id: 'LIST' }],
    }),
  }),
});



export const {
  useGetBooksQuery,
  useGetBookBySlugQuery,
  useCreateBookMutation,
  useGetAdminBooksQuery,
} = booksApi;
