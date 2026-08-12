import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FlattenMaps, Model, Types } from 'mongoose';
import {
  Book,
  BookDocument,
} from '@/infrastructure/database/schemas/book.schema';
import {
  ReadingList,
  ReadingListDocument,
  ReadingStatus,
} from '@/infrastructure/database/schemas/reading-list.schema';
import {
  Progress,
  ProgressDocument,
} from '@/infrastructure/database/schemas/progress.schema';
import {
  Review,
  ReviewDocument,
} from '@/infrastructure/database/schemas/review.schema';
import {
  UserPreference,
  UserPreferenceDocument,
} from '@/infrastructure/database/schemas/user-preference.schema';
import {
  IRecommendationDataRepository,
  PopulatedBook,
} from '@/domain/recommendations/interfaces/recommendation-data.repository.interface';
import { UserProfile } from '@/domain/recommendations/interfaces/recommendation-strategy.interface';
import { ChapterStatus } from '@/domain/library/entities/reading-progress.entity';

const BOOK_STATUS_PUBLISHED = 'published';
const HIGH_RATING_THRESHOLD = 4;
const MAX_RECENT_PROGRESSES = 20;
const MAX_RECENT_ACTIVITY = 10;
const MAX_FAVORITE_GENRES = 5;
const MAX_PREFERENCE_GENRES = 10;
const MAX_AVAILABLE_BOOKS = 100;

type LeanedReadingList = {
  _id: Types.ObjectId;
  bookId: PopulatedBook | null;
  status: string;
};

type LeanedProgress = FlattenMaps<Progress> & {
  bookId: PopulatedBook | null;
};

type LeanedReview = FlattenMaps<Review> & {
  bookId: PopulatedBook | null;
};

interface GenreInfo {
  _id: string;
  name: string;
  slug: string;
}

type LeanedPreference = FlattenMaps<UserPreference> & {
  genreId: GenreInfo | null;
};

@Injectable()
export class RecommendationDataRepository
  implements IRecommendationDataRepository
{
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(UserPreference.name)
    private preferenceModel: Model<UserPreferenceDocument>,
  ) {}

  async getInteractionCount(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    const [completedCount, reviewCount, likedCount] = await Promise.all([
      this.readingListModel.countDocuments({
        userId: userObjectId,
        status: ReadingStatus.COMPLETED,
      }),
      this.reviewModel.countDocuments({ userId: userObjectId }),
      this.bookModel.countDocuments({ likedBy: userObjectId }),
    ]);
    return completedCount + reviewCount + likedCount;
  }

  async buildUserProfile(userId: string): Promise<UserProfile> {
    const userObjectId = new Types.ObjectId(userId);

    const [readingLists, progresses, reviews, likedBooks, preferences] =
      await Promise.all([
        this.readingListModel
          .find({ userId: userObjectId })
          .populate({ path: 'bookId', populate: { path: 'genres authorId' } })
          .lean<LeanedReadingList[]>(),
        this.progressModel
          .find({ userId: userObjectId })
          .sort({ lastReadAt: -1 })
          .limit(MAX_RECENT_PROGRESSES)
          .populate({ path: 'bookId', populate: { path: 'genres' } })
          .lean<LeanedProgress[]>(),
        this.reviewModel
          .find({ userId: userObjectId })
          .populate({ path: 'bookId', populate: { path: 'genres' } })
          .lean<LeanedReview[]>(),
        this.bookModel
          .find({ likedBy: userObjectId })
          .populate('genres')
          .lean<PopulatedBook[]>(),
        this.preferenceModel
          .find({ userId: userObjectId })
          .populate('genreId')
          .sort({ score: -1 })
          .limit(MAX_PREFERENCE_GENRES)
          .lean<LeanedPreference[]>(),
      ]);

    const validReadingLists = readingLists.filter((rl) => rl.bookId != null);
    const validProgresses = progresses.filter((p) => p.bookId != null);
    const validReviews = reviews.filter((r) => r.bookId != null);

    const completedBooks = this.buildCompletedBooks(validReadingLists);
    const currentlyReading = this.buildCurrentlyReading(
      validReadingLists,
      validProgresses,
    );
    const highRatedBooks = this.buildHighRatedBooks(validReviews);
    const recentActivity = this.buildRecentActivity(validProgresses);
    const favoriteGenres = this.resolveFavoriteGenres(
      preferences,
      completedBooks,
      currentlyReading,
      highRatedBooks,
      likedBooks,
    );
    const totalReadingTime = validProgresses.reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0,
    );

    return {
      completedBooks,
      currentlyReading,
      highRatedBooks,
      recentActivity,
      favoriteGenres,
      totalReadingTime,
    };
  }

  async getAvailableBooks(userId: string): Promise<PopulatedBook[]> {
    const userObjectId = new Types.ObjectId(userId);
    const readingLists = await this.readingListModel
      .find({ userId: userObjectId })
      .select('bookId')
      .lean<Array<{ _id: Types.ObjectId; bookId: Types.ObjectId | null }>>();
    const readBookIds = readingLists
      .filter((rl) => rl.bookId != null)
      .map((rl) => rl.bookId as Types.ObjectId);

    return this.bookModel
      .find({
        _id: { $nin: readBookIds },
        status: BOOK_STATUS_PUBLISHED,
        isDeleted: false,
      })
      .populate('genres authorId')
      .limit(MAX_AVAILABLE_BOOKS)
      .lean<PopulatedBook[]>();
  }

  private buildCompletedBooks(
    readingLists: LeanedReadingList[],
  ): UserProfile['completedBooks'] {
    return readingLists
      .filter((rl) => rl.status === ReadingStatus.COMPLETED && rl.bookId)
      .map((rl) => ({ book: rl.bookId! }));
  }

  private buildCurrentlyReading(
    readingLists: LeanedReadingList[],
    progresses: LeanedProgress[],
  ): UserProfile['currentlyReading'] {
    return readingLists
      .filter((rl) => rl.status === ReadingStatus.READING && rl.bookId)
      .map((rl) => ({
        book: rl.bookId!,
        progress: this.countCompletedChapters(
          rl.bookId!._id.toString(),
          progresses,
        ),
      }));
  }

  private buildHighRatedBooks(
    reviews: LeanedReview[],
  ): UserProfile['highRatedBooks'] {
    return reviews
      .filter((r) => r.rating >= HIGH_RATING_THRESHOLD)
      .map((r) => ({
        book: r.bookId,
        rating: r.rating,
        review: r.content,
      }));
  }

  private buildRecentActivity(
    progresses: LeanedProgress[],
  ): UserProfile['recentActivity'] {
    return progresses.slice(0, MAX_RECENT_ACTIVITY).map((p) => ({
      book: p.bookId,
      timeSpent: p.timeSpent,
      lastRead: p.lastReadAt,
    }));
  }

  private resolveFavoriteGenres(
    preferences: LeanedPreference[],
    completedBooks: UserProfile['completedBooks'],
    currentlyReading: UserProfile['currentlyReading'],
    highRatedBooks: UserProfile['highRatedBooks'],
    likedBooks: PopulatedBook[],
  ): string[] {
    const fromPreferences = preferences
      .filter((p) => p.genreId?.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_FAVORITE_GENRES)
      .map((p) => p.genreId.name);

    if (fromPreferences.length > 0) {
      return fromPreferences;
    }

    return this.inferGenresFromHistory(
      completedBooks,
      currentlyReading,
      highRatedBooks,
      likedBooks,
    );
  }

  private inferGenresFromHistory(
    completedBooks: UserProfile['completedBooks'],
    currentlyReading: UserProfile['currentlyReading'],
    highRatedBooks: UserProfile['highRatedBooks'],
    likedBooks: PopulatedBook[],
  ): string[] {
    const allBooks = [
      ...completedBooks.map((cb) => cb.book),
      ...currentlyReading.map((cr) => cr.book),
      ...highRatedBooks.map((hr) => hr.book),
      ...likedBooks,
    ].filter((book): book is PopulatedBook => book != null);

    const genreCounts = new Map<string, number>();
    for (const book of allBooks) {
      for (const genre of book.genres ?? []) {
        if (genre?.name) {
          genreCounts.set(genre.name, (genreCounts.get(genre.name) ?? 0) + 1);
        }
      }
    }

    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FAVORITE_GENRES)
      .map(([name]) => name);
  }

  private countCompletedChapters(
    bookId: string,
    progresses: LeanedProgress[],
  ): number {
    return progresses.filter(
      (p) =>
        p.bookId?._id.toString() === bookId &&
        p.status === ChapterStatus.COMPLETED,
    ).length;
  }
}
