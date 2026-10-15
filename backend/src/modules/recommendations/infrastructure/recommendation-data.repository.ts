import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  IRecommendationDataRepository,
  PopulatedBook,
} from '@/modules/recommendations/domain/interfaces/recommendation-data.repository.interface';
import { UserProfile } from '@/modules/recommendations/domain/interfaces/recommendation-strategy.interface';

const BOOK_WITH_CATALOG = {
  author: { select: { id: true, name: true, photoUrl: true } },
  genres: {
    include: { genre: { select: { id: true, name: true, slug: true } } },
  },
} satisfies Prisma.BookInclude;

const READING_LIST_ACTIVITY = {
  status: true,
  book: { include: BOOK_WITH_CATALOG },
} satisfies Prisma.ReadingListSelect;

const PROGRESS_ACTIVITY = {
  status: true,
  timeSpent: true,
  lastReadAt: true,
  book: { include: BOOK_WITH_CATALOG },
} satisfies Prisma.ReadingProgressSelect;

const REVIEW_ACTIVITY = {
  rating: true,
  content: true,
  book: { include: BOOK_WITH_CATALOG },
} satisfies Prisma.ReviewSelect;

const BOOK_CATALOG = {
  include: BOOK_WITH_CATALOG,
} satisfies Prisma.BookDefaultArgs;

type ProgressActivity = Prisma.ReadingProgressGetPayload<{
  select: typeof PROGRESS_ACTIVITY;
}>;
type CatalogBook = Prisma.BookGetPayload<typeof BOOK_CATALOG>;

const HIGH_RATING_THRESHOLD = 4;
const MAX_RECENT_PROGRESSES = 20;
const MAX_RECENT_ACTIVITY = 10;
const MAX_FAVORITE_GENRES = 5;
const MAX_PREFERENCE_GENRES = 10;
const MAX_AVAILABLE_BOOKS = 100;

@Injectable()
export class RecommendationDataRepository implements IRecommendationDataRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async getInteractionCount(userId: string): Promise<number> {
    const [completedCount, reviewCount, likedCount] = await Promise.all([
      this.transactionHost.tx.readingList.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.transactionHost.tx.review.count({ where: { userId } }),
      this.transactionHost.tx.bookLike.count({ where: { userId } }),
    ]);
    return completedCount + reviewCount + likedCount;
  }

  async buildUserProfile(userId: string): Promise<UserProfile> {
    const [readingLists, progresses, reviews, likes, preferences] =
      await Promise.all([
        this.transactionHost.tx.readingList.findMany({
          where: { userId, book: { isDeleted: false } },
          select: READING_LIST_ACTIVITY,
        }),
        this.transactionHost.tx.readingProgress.findMany({
          where: { userId, book: { isDeleted: false } },
          select: PROGRESS_ACTIVITY,
          orderBy: [{ lastReadAt: 'desc' }, { id: 'desc' }],
          take: MAX_RECENT_PROGRESSES,
        }),
        this.transactionHost.tx.review.findMany({
          where: { userId, book: { isDeleted: false } },
          select: REVIEW_ACTIVITY,
        }),
        this.transactionHost.tx.bookLike.findMany({
          where: { userId, book: { isDeleted: false } },
          select: { book: { include: BOOK_WITH_CATALOG } },
        }),
        this.transactionHost.tx.userPreference.findMany({
          where: { userId },
          include: { genre: { select: { name: true } } },
          orderBy: [{ score: 'desc' }, { genreId: 'asc' }],
          take: MAX_PREFERENCE_GENRES,
        }),
      ]);

    const completedBooks = readingLists
      .filter((row) => row.status === 'COMPLETED')
      .map((row) => ({ book: toPopulatedBook(row.book) }));
    const currentlyReading = readingLists
      .filter((row) => row.status === 'READING')
      .map((row) => ({
        book: toPopulatedBook(row.book),
        progress: countCompletedChapters(row.book.id, progresses),
      }));
    const highRatedBooks = reviews
      .filter((row) => row.rating >= HIGH_RATING_THRESHOLD)
      .map((row) => ({
        book: toPopulatedBook(row.book),
        rating: row.rating,
        review: row.content,
      }));
    const recentActivity = progresses
      .slice(0, MAX_RECENT_ACTIVITY)
      .map((row) => ({
        book: toPopulatedBook(row.book),
        timeSpent: row.timeSpent,
        lastRead: row.lastReadAt,
      }));
    const likedBooks = likes.map((row) => toPopulatedBook(row.book));
    const preferredGenreNames = preferences.map(
      (preference) => preference.genre.name,
    );
    const favoriteGenres =
      preferredGenreNames.length > 0
        ? preferredGenreNames.slice(0, MAX_FAVORITE_GENRES)
        : inferFavoriteGenres(
            completedBooks,
            currentlyReading,
            highRatedBooks,
            likedBooks,
          );

    return {
      completedBooks,
      currentlyReading,
      highRatedBooks,
      recentActivity,
      favoriteGenres,
      totalReadingTime: progresses.reduce(
        (total, row) => total + row.timeSpent,
        0,
      ),
    };
  }

  async getAvailableBooks(userId: string): Promise<PopulatedBook[]> {
    const rows = await this.transactionHost.tx.book.findMany({
      where: {
        status: 'published',
        isDeleted: false,
        readingLists: { none: { userId } },
      },
      ...BOOK_CATALOG,
      orderBy: [{ views: 'desc' }, { likes: 'desc' }, { id: 'asc' }],
      take: MAX_AVAILABLE_BOOKS,
    });
    return rows.map(toPopulatedBook);
  }
}

function toPopulatedBook(book: CatalogBook): PopulatedBook {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    description: book.description,
    coverUrl: book.coverUrl,
    views: book.views,
    likes: book.likes,
    status: book.status,
    isDeleted: book.isDeleted,
    genres: book.genres.map(({ genre }) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    })),
    authorId: {
      id: book.author.id,
      name: book.author.name,
      avatar: book.author.photoUrl,
    },
  };
}

function countCompletedChapters(
  bookId: string,
  progresses: ProgressActivity[],
): number {
  return progresses.filter(
    (progress) =>
      progress.book.id === bookId && progress.status === 'COMPLETED',
  ).length;
}

function inferFavoriteGenres(
  completedBooks: UserProfile['completedBooks'],
  currentlyReading: UserProfile['currentlyReading'],
  highRatedBooks: UserProfile['highRatedBooks'],
  likedBooks: PopulatedBook[],
): string[] {
  const genreCounts = new Map<string, number>();
  const books = [
    ...completedBooks.map(({ book }) => book),
    ...currentlyReading.map(({ book }) => book),
    ...highRatedBooks.map(({ book }) => book),
    ...likedBooks,
  ];

  for (const book of books) {
    for (const genre of book.genres ?? []) {
      genreCounts.set(genre.name, (genreCounts.get(genre.name) ?? 0) + 1);
    }
  }

  return Array.from(genreCounts.entries())
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, MAX_FAVORITE_GENRES)
    .map(([name]) => name);
}
