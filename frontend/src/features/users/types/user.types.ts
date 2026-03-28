import type { PaginatedApiResult } from '@/lib/api-response';

export interface User {
    id: string;
    username: string;
    email: string;
    roleId: {
        id: string;
        name: string;
    };
    isVerified: boolean;
    isBanned: boolean;
    provider: string;
    image?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserListResponse {
    data: User[];
    meta: PaginatedApiResult<User>['meta'];
}

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

export interface UpdateUserOverviewRequest {
    bio: string;
    location: string;
    website: string;
    username: string;
}

export interface SearchUsersParams {
    keyword: string;
    current?: number;
    pageSize?: number;
}

export interface SearchUserItem {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
    createdAt: string;
}

export type SearchUsersRawItem = {
    id: string;
    username: string;
    image?: string;
    bio?: string;
    createdAt: string;
};

export type SearchUsersRawResponse = PaginatedApiResult<SearchUsersRawItem>;

export type SearchUsersResponse = PaginatedApiResult<SearchUserItem>;
