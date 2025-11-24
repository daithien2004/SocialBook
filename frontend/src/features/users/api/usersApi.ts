import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { UserListResponse } from '../types/user.types';

export interface UserOverviewReponse {
    id: string;
    username: string;
    image: string | null;
    createdAt: Date;
    postCount: number;
    readingListCount: number;
    followersCount: number;
}
export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Users'],
    endpoints: (builder) => ({
        getUsers: builder.query<UserListResponse, string>({
            query: (query) => ({
                url: `/admin/users?${query}`,
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),
        banUser: builder.mutation<void, string>({
            query: (id) => ({
                url: `/admin/users/${id}/ban`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Users'],
        }),

        getUserOverview: builder.query<UserOverviewReponse, string>({
            query: (userId) => ({
                url: `/users/${userId}/overview`,
                method: "GET",
            }),
            providesTags: (result, error, userId) => [
                { type: "Users", id: `OVERVIEW_${userId}` },
            ],
        }),
    }),
});

export const { useGetUsersQuery, useBanUserMutation , useGetUserOverviewQuery} = usersApi;
