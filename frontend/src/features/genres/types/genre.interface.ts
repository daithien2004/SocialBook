export interface Genre {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GenresListResponse {
    data: Genre[];
    meta: {
        current: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateGenreRequest {
    name: string;
    description?: string;
}

export interface UpdateGenreRequest {
    id: string;
    data: {
        name?: string;
        description?: string;
    };
}
