export interface SearchQuery {
  query: string;
  page?: number;
  limit?: number;
  genres?: string[]; // Slugs
  author?: string; // Author ID
  tags?: string[];
  sortBy?:
    | 'views'
    | 'likes'
    | 'rating'
    | 'popular'
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'publishedYear'
    | 'score';
  order?: 'asc' | 'desc';
}
