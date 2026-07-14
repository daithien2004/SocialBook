import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { normalizeArrayResponse, ArrayResponse } from '@/lib/api-response';
import type { Author } from '@/features/authors/types/author.interface';
import type { Genre } from '@/features/genres/types/genre.interface';

export const bookRelationApi = createApi({
  reducerPath: 'bookRelationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Authors', 'Genres'],
  endpoints: (builder) => ({
    getAuthors: builder.query<Author[], void>({
      query: () => ({
        url: '/authors',
        method: 'GET',
        params: { limit: 1000 },
      }),
      transformResponse: (response: ArrayResponse<Author>) => normalizeArrayResponse(response).data,
      providesTags: ['Authors'],
    }),

    getGenres: builder.query<Genre[], void>({
      query: () => ({
        url: '/genres',
        method: 'GET',
        params: { limit: 1000 },
      }),
      transformResponse: (response: ArrayResponse<Genre>) => normalizeArrayResponse(response).data,
      providesTags: ['Genres'],
    }),
  }),
});

export const {
  useGetAuthorsQuery,
  useGetGenresQuery,
} = bookRelationApi;
