import type { PaginationMeta } from '@/shared/domain/pagination.types';

export interface RecommendationBookReadModel {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly coverUrl?: string;
  readonly views: number;
  readonly likes: number;
  readonly status: string;
  readonly isDeleted: boolean;
  readonly genres: ReadonlyArray<{ id: string; name: string; slug: string }>;
  readonly author?: { id: string; name: string; avatar?: string };
}

export interface RecommendationItemReadModel {
  readonly bookId: string;
  readonly title: string;
  readonly reason: string;
  readonly matchScore: number;
  readonly slug: string;
  readonly book: RecommendationBookReadModel;
}

export interface RecommendationAnalysisReadModel {
  readonly favoriteGenres: string[];
  readonly readingPace: 'fast' | 'medium' | 'slow';
  readonly preferredLength: 'short' | 'medium' | 'long';
  readonly themes: string[];
}

export interface RecommendationsReadModel {
  readonly analysis: RecommendationAnalysisReadModel;
  readonly recommendations: RecommendationItemReadModel[];
  readonly meta: PaginationMeta;
}
