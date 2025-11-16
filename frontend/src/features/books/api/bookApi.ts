import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { BFF_BOOKS_ENDPOINTS } from '@/src/constants/client-endpoints';

export interface Author {
  _id: string;
  name: string;
  bio: string;
}

export interface Genre {
  _id: string;
  name: string;
  description: string;
}

export interface Chapter {
  _id: string;
  title: string;
  slug: string;
  content: string;
  orderIndex: number;
}

export interface Comment {
  _id: string;
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
  _id: string;
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

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Book'],
  endpoints: (builder) => ({
    // Lấy chi tiết sách theo slug
    getBookBySlug: builder.query<Book, string>({
      query: (slug) => ({
        url: BFF_BOOKS_ENDPOINTS.getBySlug(slug),
        method: 'GET',
      }),
      providesTags: (result, error, slug) => [
        { type: 'Book', id: slug },
      ],
    }),
  }),
});

export const { useGetBookBySlugQuery } = booksApi;