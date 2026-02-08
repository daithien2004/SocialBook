import { PaginationMeta } from '@/utils/helpers';

export interface BookStats {
    chapters: number;
    views: number;
    likes: number;
    rating: number;
    reviews: number;
}

export interface SearchResultBook {
    id: string;
    _id: string; // Keep for compatibility if needed, but prefer id
    title: string;
    slug: string;
    description?: string;
    coverUrl?: string;
    status: string;
    tags?: string[];
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
    authorId: {
        _id: string;
        name: string;
        avatar?: string;
    };
    genres: Array<{
        _id: string;
        name: string;
        slug: string;
    }>;
    stats: BookStats;
    score: number;
    matchType?: string;
}

export interface PaginatedSearchResult {
    data: SearchResultBook[];
    meta: PaginationMeta;
}
