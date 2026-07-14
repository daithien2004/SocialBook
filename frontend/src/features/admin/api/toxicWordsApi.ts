import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { normalizeArrayResponse, PaginatedApiResult } from '@/lib/api-response';

export interface ToxicWord {
    id: string;
    pattern: string;
    group: string;
    originalWord: string;
    createdAt: string;
    updatedAt: string;
}

export type ToxicWordsResponse = PaginatedApiResult<ToxicWord>;

export interface AddToxicWordPayload {
    pattern: string;
    group: string;
}

export const toxicWordsApi = createApi({
    reducerPath: 'toxicWordsApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['ToxicWords'],
    endpoints: (builder) => ({
        getToxicWords: builder.query<ToxicWordsResponse, { page?: number; limit?: number; search?: string }>({
            query: ({ page = 1, limit = 10, search }) => ({
                url: '/admin/toxic-words',
                method: 'GET',
                params: { page, limit, search },
            }),
            transformResponse: normalizeArrayResponse<ToxicWord>,
            providesTags: ['ToxicWords'],
        }),

        addToxicWord: builder.mutation<ToxicWord, AddToxicWordPayload>({
            query: (payload) => ({
                url: '/admin/toxic-words',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['ToxicWords'],
        }),

        deleteToxicWord: builder.mutation<void, string>({
            query: (id) => ({
                url: `/admin/toxic-words/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ToxicWords'],
        }),
    }),
});

export const {
    useGetToxicWordsQuery,
    useAddToxicWordMutation,
    useDeleteToxicWordMutation,
} = toxicWordsApi;
