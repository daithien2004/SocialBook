import { UserEvent } from '../entities/user-event.entity';
import { UserPreference } from '../entities/user-preference.entity';

export abstract class IUserAnalyticsRepository {
  abstract saveEvent(event: UserEvent): Promise<void>;

  abstract updatePreferenceScore(
    userId: string,
    genreId: string,
    delta: number,
  ): Promise<void>;

  abstract getTopGenresForUser(
    userId: string,
    limit?: number,
  ): Promise<UserPreference[]>;

  abstract findPreference(
    userId: string,
    genreId: string,
  ): Promise<UserPreference | null>;

  abstract getTrendingBooks(
    days?: number,
    limit?: number,
  ): Promise<
    {
      bookId: string;
      title: string;
      coverImage: string | null;
      score: number;
    }[]
  >;

  abstract getTopActiveReaders(
    days?: number,
    limit?: number,
  ): Promise<
    { userId: string; username: string; avatar: string | null; score: number }[]
  >;
}
