import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_GENRES_ENDPOINTS } from '@/src/constants/server-endpoints';
import { Genre, GenresListResponse, CreateGenreRequest, UpdateGenreRequest } from '../types/genre.interface';

export const genreApi = createApi({
    reducerPath: 'genreApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Genres', 'Genre'],
    endpoints: (builder) => ({
        getGenres: builder.query<GenresListResponse, { page?: number; pageSize?: number; name?: string }>({
            query: (params) => ({
                url: NESTJS_GENRES_ENDPOINTS.getAll,
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
                        ...result.data.map(({ id }) => ({ type: 'Genre' as const, id })),
                        { type: 'Genres', id: 'LIST' },
                    ]
                    : [{ type: 'Genres', id: 'LIST' }],
        }),
        getGenre: builder.query<Genre, string>({
            query: (id) => ({
                url: NESTJS_GENRES_ENDPOINTS.getById(id),
                method: 'GET',
            }),
            providesTags: (result, error, id) => [{ type: 'Genre', id }],
        }),
        createGenre: builder.mutation<Genre, CreateGenreRequest>({
            query: (body) => ({
                url: NESTJS_GENRES_ENDPOINTS.create,
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Genres', id: 'LIST' }],
        }),
        updateGenre: builder.mutation<Genre, UpdateGenreRequest>({
            query: ({ id, data }) => ({
                url: NESTJS_GENRES_ENDPOINTS.update(id),
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Genre', id },
                { type: 'Genres', id: 'LIST' },
            ],
        }),
        deleteGenre: builder.mutation<void, string>({
            query: (id) => ({
                url: NESTJS_GENRES_ENDPOINTS.delete(id),
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Genres', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetGenresQuery,
    useGetGenreQuery,
    useCreateGenreMutation,
    useUpdateGenreMutation,
    useDeleteGenreMutation,
} = genreApi;
