export interface Author {
    id: string;
    name: string;
    bio?: string;
    photoUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAuthorRequest {
    name: string;
    bio?: string;
    photoUrl?: string;
}

export interface UpdateAuthorRequest extends Partial<CreateAuthorRequest> {
    id: string;
}

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
