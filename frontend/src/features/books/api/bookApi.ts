import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  likesCount: number;
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

// ✅ API ĐƠN GIẢN - gọi thẳng đến backend
export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api', // ✅ TRỰC TIẾP đến backend
  }),
  tagTypes: ['Book'],
  endpoints: (builder) => ({
    getBookBySlug: builder.query<Book, string>({
      query: (slug) => `/books/${slug}`,
      transformResponse: (response: ApiResponse<Book>) => response.data,
    }),
  }),
});

export const { useGetBookBySlugQuery } = booksApi;