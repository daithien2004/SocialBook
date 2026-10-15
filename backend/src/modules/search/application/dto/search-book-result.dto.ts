import type { PaginationMeta } from '@/shared/domain/pagination.types';

export interface BookStats {
  chapters: number;
  views: number;
  likes: number;
  rating: number;
  reviews: number;
}

export interface SearchBookResult {
  id: string;
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
    id: string;
    name: string;
    avatar?: string;
  };
  genres: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  stats: BookStats;
  score: number;
  matchType?: string;
}

export interface PaginatedSearchBookResult {
  data: SearchBookResult[];
  meta: PaginationMeta;
}
