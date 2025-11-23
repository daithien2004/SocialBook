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
  create: '/posts',
  getOne: (id: string) => `/posts/${id}`,
  update: (id: string) => `/posts/${id}`,
  delete: (id: string) => `/posts/${id}`,
  deletePermanent: (id: string) => `/posts/${id}/permanent`,
  deleteImage: (id: string) => `/posts/${id}/images`,
};

export const BFF_BOOKS_ENDPOINTS = {
  getAll: '/books',
  getBySlug: (bookSlug: string) => `/books/${bookSlug}`,
  getById: (bookId: string) => `/admin/books/id/${bookId}`,
  createBook: '/admin/books',
  updateBook: (bookId: string) => `/admin/books/id/${bookId}`,
  deleteBook: (bookId: string) => `/admin/books/id/${bookId}`,
  getAllForAdmin: '/admin/books',
  like: (bookSlug: string) => `/books/${bookSlug}/like`,
};

export const BFF_COMMENTS_ENDPOINTS = {
  getCommentsByTarget: '/comments/target',
  postCreateComment: '/comments',
  getResolveParent: '/comments/resolve-parent',
};


export const BFF_LIKES_ENDPOINTS = {
  postToggleLike: '/likes/toggle',
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
};

export const BFF_LIBRARY_ENDPOINTS = {
  // Library System
  getLibrary: '/library', // GET ?status=...
  updateStatus: '/library/status', // POST
  updateProgress: '/library/progress', // PATCH
  updateBookCollections: '/library/collections', // PATCH
  removeBook: (bookId: string) => `/library/${bookId}`, // DELETE

  // Collections System (Folder)
  collections: '/collections', // GET, POST
  collectionDetail: (id: string) => `/collections/${id}`, // GET, PATCH, DELETE
};
