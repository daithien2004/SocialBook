import { id } from 'date-fns/locale';

export const NESTJS_AUTH_ENDPOINTS = {
  signup: '/auth/signup',
  verifyOtp: '/auth/verify-otp',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  profile: '/auth/profile',
  resendOtp: '/auth/resend-otp',
};

export const NESTJS_USERS_ENDPOINTS = {
  getUsers: '/users',
  banUser: (id: string) => `/users/${id}/ban`,
  readingPreferences: '/users/me/reading-preferences',
};

export const NESTJS_COMMENTS_ENDPOINTS = {
  getCommentsByTarget: '/comments/target',
  postCreate: '/comments',
  getResolveParent: '/comments/resolve-parent',
  getCount: '/comments/count',
};

export const NESTJS_LIKES_ENDPOINTS = {
  postToggleLike: '/likes/toggle',
  getCount: 'likes/count',
  getStatus: 'likes/status'
};

export const NESTJS_BOOKS_ENDPOINTS = {
  getBooks: '/books',
  getBookStats: (bookId: string) => `/books/id/${bookId}/stats`,
  getBookBySlug: (bookSlug: string) => `/books/${bookSlug}`,
  getBookById: (bookId: string) => `/books/id/${bookId}`,
  createBook: '/books',
  updateBook: (bookId: string) => `/books/${bookId}`,
  deleteBook: (bookId: string) => `/books/${bookId}`,
  getAllBookForAdmin: '/books/admin/all',
  like: (bookSlug: string) => `/books/${bookSlug}/like`,
};

export const NESTJS_CHAPTERS_ENDPOINTS = {
  // Public endpoints
  getChapterBySlug: (bookSlug: string, chapterSlug: string) =>
    `/books/${bookSlug}/chapters/${chapterSlug}`,
  getChapters: (bookSlug: string) => `/books/${bookSlug}/chapters`,
  getChapterById: (bookSlug: string, chapterId: string) =>
    `/books/${bookSlug}/chapters/id/${chapterId}`,
  createChapter: (bookSlug: string) => `/books/${bookSlug}/chapters`,
  updateChapter: (bookSlug: string, chapterId: string) =>
    `/books/${bookSlug}/chapters/${chapterId}`,
  deleteChapter: (bookSlug: string, chapterId: string) =>
    `/books/${bookSlug}/chapters/${chapterId}`,
  // Admin-specific endpoints
  createChapterByBookId: (bookId: string) => `/books/${bookId}/chapters`,
  updateChapterAdmin: (bookSlug: string, chapterId: string) =>
    `/books/${bookSlug}/chapters/${chapterId}`,
  deleteChapterAdmin: (bookSlug: string, chapterId: string) =>
    `/books/${bookSlug}/chapters/${chapterId}`,
};

export const NESTJS_POSTS_ENDPOINTS = {
  getAll: '/posts',
  create: '/posts',
  update: (id: string) => `/posts/${id}`,
  getOne: (id: string) => `/posts/${id}`,
  delete: (id: string) => `/posts/${id}`,
  deletePermanent: (id: string) => `/posts/${id}/permanent`,
  deleteHard: (id: string) => `/posts/${id}/permanent`,
  deleteImage: (id: string) => `/posts/${id}/images`,
};

export const NESTJS_REVIEWS_ENDPOINTS = {
  create: '/reviews',
  getByBook: (bookId: string) => `/reviews/book/${bookId}`,
  update: (id: string) => `/reviews/${id}`,
  delete: (id: string) => `/reviews/${id}`,
  toggleLike: (id: string) => `/reviews/${id}/like`,
};

export const NESTJS_LIBRARY_ENDPOINTS = {
  // Library System
  getLibrary: '/library',
  updateStatus: '/library/status',
  updateProgress: '/library/progress',
  updateBookCollections: '/library/collections',
  removeBook: (bookId: string) => `/library/${bookId}`,
  getBookLibraryInfo: (bookId: string) => `/library/book/${bookId}`,

  // Collections System (Folder)
  collections: '/collections', // GET, POST
  collectionDetail: (id: string) => `/collections/${id}`,
};

export const NESTJS_STATISTICS_ENDPOINTS = {
  overview: '/statistics/overview',
  users: '/statistics/users',
  books: '/statistics/books',
  posts: '/statistics/posts',
  growth: (days?: number) => `/statistics/growth${days ? `?days=${days}` : ''}`,
};

export const NESTJS_AUTHORS_ENDPOINTS = {
  getAll: '/authors/admin',
  getById: (id: string) => `/authors/${id}`,
  create: '/authors',
  update: (id: string) => `/authors/${id}`,
  delete: (id: string) => `/authors/${id}`,
};

export const NESTJS_GENRES_ENDPOINTS = {
  getAll: '/genres/admin',
  getById: (id: string) => `/genres/${id}`,
  create: '/genres',
  update: (id: string) => `/genres/${id}`,
  delete: (id: string) => `/genres/${id}`,
};

export const NESTJS_TTS_ENDPOINTS = {
  generateChapter: (chapterId: string) => `/text-to-speech/chapter/${chapterId}`,
  generateBook: (bookId: string) => `/text-to-speech/book/${bookId}/all`,
  getByChapter: (chapterId: string) => `/text-to-speech/chapter/${chapterId}`,
  delete: (chapterId: string) => `/text-to-speech/chapter/${chapterId}`,
  incrementPlay: (chapterId: string) => `/text-to-speech/chapter/${chapterId}/play`,
};

export const NESTJS_GEMINI_ENDPOINTS = {
  summarizeChapter: (chapterId: string) => `/gemini/summarize-chapter/${chapterId}`,
};
