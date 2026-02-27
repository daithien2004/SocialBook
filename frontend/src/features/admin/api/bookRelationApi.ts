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
        params: { limit: 1000 },
      }),
      transformResponse: (response: { data?: AuthorOption[] } | AuthorOption[]): AuthorOption[] => {
        if (Array.isArray(response)) return response;
        return (response as { data?: AuthorOption[] }).data ?? [];
      },
      providesTags: ['Authors'],
    }),

    getGenres: builder.query<GenreOption[], void>({
      query: () => ({
        url: '/genres',
        method: 'GET',
        params: { limit: 1000 },
      }),
      transformResponse: (response: { data?: GenreOption[] } | GenreOption[]): GenreOption[] => {
        if (Array.isArray(response)) return response;
        return (response as { data?: GenreOption[] }).data ?? [];
      },
      providesTags: ['Genres'],
    }),
  }),
});

export const {
  useGetAuthorsQuery,
  useGetGenresQuery,
} = bookRelationApi;