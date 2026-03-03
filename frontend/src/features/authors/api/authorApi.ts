import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_AUTHORS_ENDPOINTS } from '@/constants/server-endpoints';
import {
  Author,
  AuthorsListResponse,
  CreateAuthorRequest,
  UpdateAuthorRequest,
} from '../types/author.interface';

export const authorApi = createApi({
  reducerPath: 'authorApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Authors', 'Author'],
  endpoints: (builder) => ({
    getAuthors: builder.query<
      AuthorsListResponse,
      { page?: number; pageSize?: number; name?: string }
    >({
      query: (params) => ({
        url: NESTJS_AUTHORS_ENDPOINTS.getAll,
        method: 'GET',
        params: {
          current: params.page || 1,
          pageSize: params.pageSize || 10,
          name: params.name,
        },
      }),
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Author' as const, id })),
            { type: 'Authors', id: 'LIST' },
          ]
          : [{ type: 'Authors', id: 'LIST' }],
    }),
    getAuthor: builder.query<Author, string>({
      query: (id) => ({
        url: NESTJS_AUTHORS_ENDPOINTS.getById(id),
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Author', id }],
    }),
    createAuthor: builder.mutation<Author, CreateAuthorRequest>({
      query: (body) => ({
        url: NESTJS_AUTHORS_ENDPOINTS.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Authors', id: 'LIST' }],
    }),
    updateAuthor: builder.mutation<Author, UpdateAuthorRequest>({
      query: ({ id, data }) => ({
        url: NESTJS_AUTHORS_ENDPOINTS.update(id),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Author', id },
        { type: 'Authors', id: 'LIST' },
      ],
    }),
    deleteAuthor: builder.mutation<void, string>({
      query: (id) => ({
        url: NESTJS_AUTHORS_ENDPOINTS.delete(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Authors', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAuthorsQuery,
  useGetAuthorQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation,
  useDeleteAuthorMutation,
} = authorApi;
