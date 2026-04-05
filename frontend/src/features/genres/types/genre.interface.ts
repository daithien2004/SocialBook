import type { PaginatedApiResult } from '@/lib/api-response';

export interface Genre {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export type GenresListResponse = PaginatedApiResult<Genre>;

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
