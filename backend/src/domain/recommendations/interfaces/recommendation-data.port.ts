import { UserProfile } from './recommendation-strategy.interface';

/**
 * Port interface for fetching data needed to build recommendation profiles.
 * Decouples the Use Case from direct Mongoose model access.
 */
export abstract class IRecommendationDataPort {
  /**
   * Build a user's reading profile based on their reading history,
   * completed books, reviews, and liked books.
   */
  abstract buildUserProfile(userId: string): Promise<UserProfile>;

  /**
   * Get books that the user hasn't interacted with yet (available for recommendation).
   */
  abstract getAvailableBooks(userId: string): Promise<PopulatedBook[]>;

  /**
   * Count how many reading interactions the user has had
   * (completed books + reviews + liked books).
   */
  abstract getInteractionCount(userId: string): Promise<number>;
}

export interface PopulatedBook {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  views: number;
  likes: number;
  status: string;
  isDeleted: boolean;
  genres?: Array<{ _id: string; name: string; slug: string }>;
  authorId?: { _id: string; name: string; avatar?: string };
}
