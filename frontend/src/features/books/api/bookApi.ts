import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_BOOKS_ENDPOINTS } from '@/src/constants/client-endpoints';
import { Book } from '../types/book.interface';

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

interface CreateBookDto {
  title: string;
  slug?: string;
  authorId: string;
  genre: string[];
  description?: string;
  coverUrl?: string;
  publishedYear?: string;
  status?: 'draft' | 'published' | 'completed';
  tags?: string[];
}

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Books', 'Book'],
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

    createBook: builder.mutation<Book, CreateBookDto>({
      query: (data) => ({
        url: BFF_BOOKS_ENDPOINTS.createBook,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Books', id: 'LIST' }],
    }),
  }),
});

export const { useGetBooksQuery, useGetBookBySlugQuery,
  useCreateBookMutation } = booksApi;