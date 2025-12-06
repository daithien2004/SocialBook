import { get } from 'http';

export const BFF_AUTH_ENDPOINTS = {
  signup: '/auth/signup',
  verifyOtp: '/auth/verify-otp',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  profile: '/auth/profile',
  resendOtp: '/auth/resend-otp',
};

export const BFF_POSTS_ENDPOINTS = {
  getAll: '/posts',
  getAllByUser: '/posts/user',
  create: '/posts',
  getOne: (id: string) => `/posts/${id}`,
  update: (id: string) => `/posts/${id}`,
  delete: (id: string) => `/posts/${id}`,
  deletePermanent: (id: string) => `/posts/${id}/permanent`,
  deleteImage: (id: string) => `/posts/${id}/images`,
};

export const BFF_BOOKS_ENDPOINTS = {
  getAll: '/books',
  getBookStats: (bookId: string) => `/books/id/${bookId}/stats`,
  getBySlug: (bookSlug: string) => `/books/${bookSlug}`,
  getById: (bookId: string) => `/admin/books/id/${bookId}`,
  createBook: '/admin/books',
  updateBook: (bookId: string) => `/admin/books/id/${bookId}`,
  deleteBook: (bookId: string) => `/admin/books/id/${bookId}`,
  getAllForAdmin: '/admin/books',
  like: (bookSlug: string) => `/books/${bookSlug}/like`,
  getFilters: '/books/filters/all',
};

export const BFF_COMMENTS_ENDPOINTS = {
  getCommentsByTarget: '/comments/target',
  postCreateComment: '/comments',
  getResolveParent: '/comments/resolve-parent',
  getCount: '/comments/count',
};

export const BFF_LIKES_ENDPOINTS = {
  postToggleLike: '/likes/toggle',
  getCount: '/likes/count',
  getStatus: '/likes/status',
};

export const BFF_CHAPTERS_ENDPOINTS = {
  getChapterBySlug: (bookSlug: string, chapterSlug: string) =>
    `/books/${bookSlug}/chapters/${chapterSlug}`,
  getChapters: (bookSlug: string) => `/books/${bookSlug}/chapters`,
  // Admin endpoints
  getChapterById: (bookSlug: string, chapterId: string) =>
    `/admin/books/${bookSlug}/chapters/${chapterId}`,
  createChapter: (bookSlug: string) => `/admin/books/${bookSlug}/chapters`,
  updateChapter: (bookSlug: string, chapterId: string) =>
    `/admin/books/${bookSlug}/chapters/${chapterId}`,
  deleteChapter: (bookSlug: string, chapterId: string) =>
    `/admin/books/${bookSlug}/chapters/${chapterId}`,
};

export const BFF_REVIEWS_ENDPOINTS = {
  create: '/reviews',
  getByBook: (bookId: string) => `/reviews/book/${bookId}`,
  update: (id: string) => `/reviews/${id}`,
  delete: (id: string) => `/reviews/${id}`,
  toggleLike: (id: string) => `/reviews/${id}/like`,
};

export const BFF_LIBRARY_ENDPOINTS = {
  // Library System
  getLibrary: '/library', // GET ?status=...
  updateStatus: '/library/status', // POST
  updateProgress: '/library/progress', // PATCH
  updateBookCollections: '/library/collections', // PATCH
  removeBook: (bookId: string) => `/library/${bookId}`, // DELETE
  getBookLibraryInfo: (bookId: string) => `/library/${bookId}`, // GET

  // Collections System (Folder)
  collections: '/collections', // GET, POST
  collectionDetail: (id: string) => `/collections/${id}`, // GET, PATCH, DELETE
  collectionDetailNoUser: (id: string, userId?: string) =>
    `/collections/detail?id=${id}&userId=${userId}`,
};

export const BFF_AUTHORS_ENDPOINTS = {
  getAll: '/admin/authors',
  getById: (id: string) => `/admin/authors/${id}`,
  create: '/admin/authors',
  update: (id: string) => `/admin/authors/${id}`,
  delete: (id: string) => `/admin/authors/${id}`,
};

export const BFF_GENRES_ENDPOINTS = {
  getAll: '/admin/genres',
  getById: (id: string) => `/admin/genres/${id}`,
  create: '/admin/genres',
  update: (id: string) => `/admin/genres/${id}`,
  delete: (id: string) => `/admin/genres/${id}`,
};

export const BFF_TTS_ENDPOINTS = {
  generateChapter: (chapterId: string) => `/tts/chapter/${chapterId}`,
  generateBook: (bookId: string) => `/tts/book/${bookId}/all`,
  getByChapter: (chapterId: string) => `/tts/chapter/${chapterId}`,
  delete: (chapterId: string) => `/tts/chapter/${chapterId}`,
  incrementPlay: (chapterId: string) => `/tts/chapter/${chapterId}/play`,
};

export const BFF_USERS_ENDPOINTS = {
  readingPreferences: '/users/reading-preferences',
};

export const BFF_GEMINI_ENDPOINTS = {
  summarizeChapter: (chapterId: string) =>
    `/gemini/summarize-chapter/${chapterId}`,
};
