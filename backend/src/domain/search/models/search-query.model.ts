export interface SearchQuery {
    query: string;
    page?: number;
    limit?: number;
    genres?: string; // Comma separated slugs
    author?: string; // Author ID
    tags?: string; // Comma separated
    sortBy?: 'views' | 'likes' | 'rating' | 'popular' | 'createdAt' | 'updatedAt' | 'score';
    order?: 'asc' | 'desc';
}
