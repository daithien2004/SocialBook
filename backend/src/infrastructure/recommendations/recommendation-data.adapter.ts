import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Book,
  BookDocument,
} from '@/infrastructure/database/schemas/book.schema';
import {
  ReadingList,
  ReadingListDocument,
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
  IRecommendationDataPort,
  PopulatedBook,
} from '@/domain/recommendations/interfaces/recommendation-data.port';
import { UserProfile } from '@/domain/recommendations/interfaces/recommendation-strategy.interface';

@Injectable()
export class RecommendationDataAdapter implements IRecommendationDataPort {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async getInteractionCount(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    const [completedCount, reviewCount, likedCount] = await Promise.all([
      this.readingListModel.countDocuments({
        userId: userObjectId,
        status: 'COMPLETED',
      }),
      this.reviewModel.countDocuments({ userId: userObjectId }),
      this.bookModel.countDocuments({ likedBy: userObjectId }),
    ]);
    return completedCount + reviewCount + likedCount;
  }

  async buildUserProfile(userId: string): Promise<UserProfile> {
    const userObjectId = new Types.ObjectId(userId);

    const [readingLists, progresses, reviews, likedBooks] = await Promise.all([
      this.readingListModel
        .find({ userId: userObjectId })
        .populate({ path: 'bookId', populate: { path: 'genres authorId' } })
        .lean<any[]>(),
      this.progressModel
        .find({ userId: userObjectId })
        .sort({ lastReadAt: -1 })
        .limit(20)
        .populate({ path: 'bookId', populate: { path: 'genres' } })
        .lean<any[]>(),
      this.reviewModel
        .find({ userId: userObjectId })
        .populate({ path: 'bookId', populate: { path: 'genres' } })
        .lean<any[]>(),
      this.bookModel.find({ likedBy: userObjectId }).populate('genres'),
    ]);

    const validReadingLists = readingLists.filter((rl) => rl.bookId != null);
    const validProgresses = progresses.filter((p) => p.bookId != null);
    const validReviews = reviews.filter((r) => r.bookId != null);

    const completedBooks = validReadingLists
      .filter((rl) => rl.status === 'COMPLETED')
      .map((rl) => ({ book: rl.bookId }));

    const currentlyReading = validReadingLists
      .filter((rl) => rl.status === 'READING')
      .map((rl) => ({
        book: rl.bookId,
        progress: this._calculateBookProgress(
          rl.bookId._id.toString(),
          validProgresses,
        ),
      }));

    const highRatedBooks = validReviews
      .filter((r) => r.rating >= 4)
      .map((r) => ({
        book: r.bookId,
        rating: r.rating,
        review: r.content,
      }));

    const recentActivity = validProgresses.slice(0, 10).map((p) => ({
      book: p.bookId,
      timeSpent: p.timeSpent,
      lastRead: p.lastReadAt,
    }));

    const genreCounts = new Map<string, number>();
    const allBooks = [
      ...completedBooks.map((cb) => cb.book),
      ...currentlyReading.map((cr) => cr.book),
      ...highRatedBooks.map((hr) => hr.book),
      ...likedBooks,
    ].filter((book) => book != null);

    allBooks.forEach((book) => {
      if (book?.genres) {
        book.genres.forEach((genre: any) => {
          if (genre && genre.name) {
            genreCounts.set(genre.name, (genreCounts.get(genre.name) || 0) + 1);
          }
        });
      }
    });

    const favoriteGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);

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
      .lean<any[]>();
    const readBookIds = readingLists
      .filter((rl) => rl.bookId != null)
      .map((rl) => rl.bookId);

    return this.bookModel
      .find({
        _id: { $nin: readBookIds },
        status: 'published',
        isDeleted: false,
      })
      .populate('genres authorId')
      .limit(100)
      .lean<PopulatedBook[]>();
  }

  private _calculateBookProgress(bookId: string, progresses: any[]): number {
    const bookProgresses = progresses.filter(
      (p) => p.bookId && p.bookId._id && p.bookId._id.toString() === bookId,
    );
    if (bookProgresses.length === 0) return 0;
    return bookProgresses.filter((p) => p.status === 'completed').length;
  }
}
