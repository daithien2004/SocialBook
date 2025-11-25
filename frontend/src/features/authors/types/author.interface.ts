export interface Author {
    id: string;
    name: string;
    bio?: string;
    photoUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export type CreateAuthorRequest = FormData | {
    name: string;
    bio?: string;
    photoUrl?: string;
};

export type UpdateAuthorRequest = {
    id: string;
    data: FormData | Partial<{
        name: string;
        bio: string;
        photoUrl: string;
    }>;
};

export interface AuthorResponse {
    message: string;
    data: Author;
}

export interface AuthorsListResponse {
    meta: {
        current: number;
        pageSize: number;
        totalPages: number;
        total: number;
    };
    data: Author[];
}
