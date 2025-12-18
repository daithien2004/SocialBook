import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_USERS_ENDPOINTS } from '@/src/constants/server-endpoints';
import { UpdateUserOverviewRequest, UserListResponse, UserOverviewResponse } from '../types/user.types';

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Users'],
    endpoints: (builder) => ({
        getUsers: builder.query<UserListResponse, string>({
            query: (query) => ({
                url: `${NESTJS_USERS_ENDPOINTS.getUsersAdmin}?${query}`,
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),
        banUser: builder.mutation<void, string>({
            query: (id) => ({
                url: NESTJS_USERS_ENDPOINTS.banUser(id),
                method: 'PATCH',
            }),
            invalidatesTags: ['Users'],
        }),

        patchUpdateUserProfileOverview: builder.mutation<
            UserOverviewResponse,
            { body: UpdateUserOverviewRequest; userId: string }
        >({
            query: ({ body }) => ({
                url: `/users/me/overview`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'Users', id: `OVERVIEW_${userId}` },
            ],
        }),

        patchUpdateUserAvatar: builder.mutation<
            UserOverviewResponse,
            { file: File; userId: string }
        >({
            query: ({ file }) => {
                const formData = new FormData();
                formData.append("file", file);

                return {
                    url: `/users/me/avatar`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: (result, error, { userId }) => [
                { type: "Users", id: `OVERVIEW_${userId}` },
            ],
        }),

        getUserOverview: builder.query<UserOverviewResponse, string>({
            query: (userId) => ({
                url: `/users/${userId}/overview`,
                method: "GET",
            }),
            providesTags: (result, error, userId) => [
                { type: "Users", id: `OVERVIEW_${userId}` },
            ],
        }),

        getReadingPreferences: builder.query<any, void>({
            query: () => ({
                url: '/users/reading-preferences',
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),

        updateReadingPreferences: builder.mutation<any, any>({
            query: (body) => ({
                url: '/users/reading-preferences',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useBanUserMutation,
    useGetUserOverviewQuery,
    usePatchUpdateUserProfileOverviewMutation,
    usePatchUpdateUserAvatarMutation,
    useGetReadingPreferencesQuery,
    useUpdateReadingPreferencesMutation,
} = usersApi;
