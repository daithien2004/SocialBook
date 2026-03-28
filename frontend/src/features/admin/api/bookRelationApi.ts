import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { extractArrayData } from '@/lib/api-response';
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
      transformResponse: extractArrayData<AuthorOption>,
      providesTags: ['Authors'],
    }),

    getGenres: builder.query<GenreOption[], void>({
      query: () => ({
        url: '/genres',
        method: 'GET',
        params: { limit: 1000 },
      }),
      transformResponse: extractArrayData<GenreOption>,
      providesTags: ['Genres'],
    }),
  }),
});

export const {
  useGetAuthorsQuery,
  useGetGenresQuery,
} = bookRelationApi;
