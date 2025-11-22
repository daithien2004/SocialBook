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
    items: User[];
    pagination: {
        current: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}
