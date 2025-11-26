import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { UserListResponse } from '../types/user.types';

export interface UserOverviewResponse {
    id: string;
    username: string;
    image: string | null;
    createdAt: Date;
    postCount: number;
    bio: string;
    location: string;
    website: string;
    readingListCount: number;
    followersCount: number;
}

export interface  UpdateUserOverviewRequest {
    bio: string;
    location: string;
    website: string;
    username: string;
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
    }),
});

export const {
    useGetUsersQuery, useBanUserMutation , useGetUserOverviewQuery,
    usePatchUpdateUserProfileOverviewMutation, usePatchUpdateUserAvatarMutation} = usersApi;
