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
    meta: {
        current: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
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

export interface SearchUsersResponse {
    message: string;
    data: {
        id: string;
        username: string;
        image?: string;
        bio?: string;
        createdAt: string;
    }[];
    meta: {
        current: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
