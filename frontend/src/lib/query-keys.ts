import type { GetAdminBooksParams, GetBooksParams } from '@/features/books/types/book.interface';
import type { GetChaptersParams } from '@/features/chapters/types/chapter.interface';
import type {
  CommentRequest,
  GetCommentsRequest,
} from '@/features/comments/types/comment.interface';
import type { GetFlaggedPostsParams } from '@/features/admin/api/moderation.api';
import type { LikeRequest } from '@/features/likes/schemas/like.schema';
import type { LibraryStatus } from '@/features/library/types/library.interface';
import type {
  PaginationParams,
  PaginationParamsByUser,
} from '@/features/posts/types/post.interface';
import type { GetRecommendationsRequest } from '@/features/recommendations/types/recommendation.interface';
import type { SearchUsersParams } from '@/features/users/types/user.types';
import type { GetToxicWordsParams } from '@/features/admin/api/toxic-words.api';

export const analyticsKeys = {
  all: ['analytics'] as const,
  readingHeatmap: () => [...analyticsKeys.all, 'reading-heatmap'] as const,
  chapterEngagement: (limit?: number) =>
    [...analyticsKeys.all, 'chapter-engagement', limit] as const,
  readingSpeed: (days?: number) =>
    [...analyticsKeys.all, 'reading-speed', days] as const,
  geographic: () => [...analyticsKeys.all, 'geographic'] as const,
  activeUsers: () => [...analyticsKeys.all, 'active-users'] as const,
  overviewStats: () => [...analyticsKeys.all, 'overview-stats'] as const,
  growthStats: (days: number, groupBy?: string) =>
    [...analyticsKeys.all, 'growth-stats', days, groupBy] as const,
  bookStats: () => [...analyticsKeys.all, 'book-stats'] as const,
};

export const authorKeys = {
  all: ['authors'] as const,
  lists: () => [...authorKeys.all, 'list'] as const,
  list: (params?: { page?: number; pageSize?: number; name?: string }) =>
    [...authorKeys.lists(), params] as const,
  detail: (id: string) => [...authorKeys.all, 'detail', id] as const,
};

export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  byBook: (bookId: string) => [...bookmarkKeys.all, 'book', bookId] as const,
};

export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (params?: GetBooksParams) => [...bookKeys.lists(), params] as const,
  adminLists: () => [...bookKeys.all, 'admin-list'] as const,
  adminList: (params?: GetAdminBooksParams) =>
    [...bookKeys.adminLists(), params] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (slug: string) => [...bookKeys.details(), slug] as const,
  byId: (id: string) => [...bookKeys.all, 'id', id] as const,
  stats: (id: string) => [...bookKeys.all, 'stats', id] as const,
  filters: () => [...bookKeys.all, 'filters'] as const,
  trendingSearches: () => [...bookKeys.all, 'trending-searches'] as const,
  topRead: (params?: { timeRange: string; limit?: number }) =>
    [...bookKeys.all, 'top-read', params] as const,
};

export const chapterKeys = {
  all: ['chapters'] as const,
  detail: (bookSlug: string, chapterSlug: string) =>
    [...chapterKeys.all, 'detail', bookSlug, chapterSlug] as const,
  list: (params: GetChaptersParams) =>
    [...chapterKeys.all, 'list', params.bookSlug, params.page, params.limit] as const,
  adminList: (params: GetChaptersParams) =>
    [...chapterKeys.all, 'admin-list', params.bookSlug, params.page, params.limit] as const,
  byId: (bookSlug: string, chapterId: string) =>
    [...chapterKeys.all, 'by-id', bookSlug, chapterId] as const,
  importStatus: (bookSlug: string, jobId: string, timestamp?: number) =>
    [...chapterKeys.all, 'import-status', bookSlug, jobId, timestamp] as const,
  knowledge: (bookSlug: string, chapterId: string, force?: boolean) =>
    [...chapterKeys.all, 'knowledge', bookSlug, chapterId, force] as const,
};

export const commentKeys = {
  all: ['comments'] as const,
  byTarget: (req: GetCommentsRequest) =>
    [
      ...commentKeys.all,
      'by-target',
      req.targetId,
      req.parentId ?? 'root',
      req.cursor,
      req.limit,
    ] as const,
  byTargetPrefix: (targetId: string, parentId?: string | null) =>
    [...commentKeys.all, 'by-target', targetId, parentId ?? 'root'] as const,
  count: (req: CommentRequest) =>
    [...commentKeys.all, 'count', req.targetType, req.targetId] as const,
};

export const followKeys = {
  all: ['follows'] as const,
  following: (userId: string) =>
    [...followKeys.all, 'following', userId] as const,
  followers: (targetUserId: string) =>
    [...followKeys.all, 'followers', targetUserId] as const,
  status: (targetId: string) => [...followKeys.all, 'status', targetId] as const,
};

export const genreKeys = {
  all: ['genres'] as const,
  lists: () => [...genreKeys.all, 'list'] as const,
  list: (params?: { page?: number; pageSize?: number; name?: string }) =>
    [...genreKeys.lists(), params] as const,
  detail: (id: string) => [...genreKeys.all, 'detail', id] as const,
};

export const libraryKeys = {
  all: ['library'] as const,
  books: (status?: LibraryStatus | string, limit?: number) =>
    [...libraryKeys.all, 'books', status, limit] as const,
  chapterProgress: (bookId: string, chapterId: string) =>
    [...libraryKeys.all, 'chapter-progress', bookId, chapterId] as const,
  bookInfo: (bookId: string) =>
    [...libraryKeys.all, 'book-info', bookId] as const,
  collections: (userId?: string | null) =>
    [...libraryKeys.all, 'collections', userId] as const,
  collectionDetail: (id: string) =>
    [...libraryKeys.all, 'collection-detail', id] as const,
  collectionDetailUser: (userId: string, id: string) =>
    [...libraryKeys.all, 'collection-detail-user', userId, id] as const,
  knowledgeGraph: () => [...libraryKeys.all, 'knowledge-graph'] as const,
};

export const likeKeys = {
  all: ['likes'] as const,
  count: (req: LikeRequest) =>
    [...likeKeys.all, 'count', req.targetType, req.targetId] as const,
  status: (req: LikeRequest) =>
    [...likeKeys.all, 'status', req.targetType, req.targetId] as const,
};

export const moderationKeys = {
  all: ['moderation'] as const,
  flaggedPosts: (params?: GetFlaggedPostsParams) =>
    [...moderationKeys.all, 'flagged-posts', params] as const,
  stats: () => [...moderationKeys.all, 'stats'] as const,
};

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...postKeys.lists(), params] as const,
  byUserLists: () => [...postKeys.all, 'by-user'] as const,
  byUser: (params?: PaginationParamsByUser) =>
    [...postKeys.byUserLists(), params] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string, userId?: string) =>
    [...postKeys.details(), id, userId] as const,
  trendingBooks: (params?: { days?: number; limit?: number }) =>
    [...postKeys.all, 'trending-books', params] as const,
  topReaders: (params?: { days?: number; limit?: number }) =>
    [...postKeys.all, 'top-readers', params] as const,
};

export const rateLimitKeys = {
  all: ['rate-limits'] as const,
  gemini: () => [...rateLimitKeys.all, 'gemini'] as const,
};

export const readingRoomsKeys = {
  all: ['reading-rooms'] as const,
  room: (code: string) => [...readingRoomsKeys.all, 'detail', code] as const,
  myActive: () => [...readingRoomsKeys.all, 'my-active'] as const,
  myHistory: () => [...readingRoomsKeys.all, 'my-history'] as const,
};

export const recommendationsKeys = {
  all: ['recommendations'] as const,
  personalized: (params?: GetRecommendationsRequest) =>
    [...recommendationsKeys.all, 'personalized', params] as const,
};

export const reviewKeys = {
  all: ['reviews'] as const,
  byBook: (bookId: string) => [...reviewKeys.all, 'by-book', bookId] as const,
};

export const roomInteractionKeys = {
  all: ['room-interactions'] as const,
  quotes: (code: string) => [...roomInteractionKeys.all, 'quotes', code] as const,
  comments: (code: string, chapterSlug?: string) =>
    [...roomInteractionKeys.all, 'comments', code, chapterSlug] as const,
  reactions: (code: string, chapterSlug?: string) =>
    [...roomInteractionKeys.all, 'reactions', code, chapterSlug] as const,
};

export const toxicWordsKeys = {
  all: ['toxic-words'] as const,
  list: (params?: GetToxicWordsParams) =>
    [...toxicWordsKeys.all, 'list', params] as const,
};

export const ttsKeys = {
  all: ['tts'] as const,
  byChapter: (chapterId: string) =>
    [...ttsKeys.all, 'chapter', chapterId] as const,
};

export const userHighlightKeys = {
  all: ['user-highlights'] as const,
  byBook: (bookId: string) => [...userHighlightKeys.all, 'book', bookId] as const,
  byChapter: (chapterId: string) =>
    [...userHighlightKeys.all, 'chapter', chapterId] as const,
};

export const userKeys = {
  all: ['users'] as const,
  adminLists: () => [...userKeys.all, 'admin-list'] as const,
  adminList: (query: string) => [...userKeys.adminLists(), query] as const,
  overview: (userId: string) => [...userKeys.all, 'overview', userId] as const,
  readingPreferences: () =>
    [...userKeys.all, 'reading-preferences'] as const,
  search: (params: SearchUsersParams) =>
    [...userKeys.all, 'search', params] as const,
};