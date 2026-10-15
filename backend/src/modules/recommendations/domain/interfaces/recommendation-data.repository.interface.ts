import { UserProfile } from './recommendation-strategy.interface';

export abstract class IRecommendationDataRepository {
  abstract buildUserProfile(userId: string): Promise<UserProfile>;
  abstract getAvailableBooks(userId: string): Promise<PopulatedBook[]>;
  abstract getInteractionCount(userId: string): Promise<number>;
}

export interface PopulatedBook {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  views: number;
  likes: number;
  status: string;
  isDeleted: boolean;
  genres?: Array<{ id: string; name: string; slug: string }>;
  authorId?: { id: string; name: string; avatar?: string };
}
