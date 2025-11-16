import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_BOOKS_ENDPOINTS } from '@/src/constants/client-endpoints';

export interface Author {
  id: string;
  name: string;
  bio: string;
}

export interface Genre {
  id: string;
  name: string;
  description: string;
}

export interface Chapter {
  id: string;
  title: string;
  slug: string;
  content: string;
  orderIndex: number;
}

export interface Comment {
  id: string;
  content: string;
  userId: {
    _id: string;
    username: string;
    image?: string;
  };
  likesCount: number;
  rating: number;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  status: string;
  tags: string[];
  totalRatings: number;
  averageRating: number;
  views: number;
  likes: number;
  publishedYear: string;
  author: Author;
  genres: Genre[];
  chapters: Chapter[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

interface GetBookRequest {
  bookSlug: string;
}

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Books'],
  endpoints: (builder) => ({
    // Lấy chi tiết sách theo slug
    getBookBySlug: builder.query<Book, GetBookRequest>({
      query: (data) => ({
        url: BFF_BOOKS_ENDPOINTS.getBySlug(data.bookSlug),
        method: 'GET',
      }),
      providesTags: ['Books'],
    }),
  }),
});

export const { useGetBookBySlugQuery } = booksApi;
