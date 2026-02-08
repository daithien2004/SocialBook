import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { AuthorOption, GenreOption } from '../types/bookRelation.interface';

export const bookRelationApi = createApi({
  reducerPath: 'bookRelationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Authors', 'Genres'],
  endpoints: (builder) => ({
    getAuthors: builder.query<AuthorOption[], void>({
      query: () => ({
        url: '/authors',
        method: 'GET',
      }),
      providesTags: ['Authors'],
    }),

    getGenres: builder.query<GenreOption[], void>({
      query: () => ({
        url: '/genres',
        method: 'GET',
      }),
      providesTags: ['Genres'],
    }),
  }),
});

export const {
  useGetAuthorsQuery,
  useGetGenresQuery,
} = bookRelationApi;