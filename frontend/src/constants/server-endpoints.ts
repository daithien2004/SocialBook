export const NESTJS_AUTH_ENDPOINTS = {
  signup: '/auth/signup',
  verifyOtp: '/auth/verify-otp',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  profile: '/auth/profile',
  resendOtp: '/auth/resend-otp',
};

export const NESTJS_COMMENTS_ENDPOINTS = {
  getCommentsByTarget: '/comments/target',
  postCreate: '/comments',
  getResolveParent: '/comments/resolve-parent',
};

export const NESTJS_BOOKS_ENDPOINTS = {
  getBooks: '/books',
  getBookBySlug: (bookSlug: string) => `/books/${bookSlug}`,
};

export const NESTJS_CHAPTERS_ENDPOINTS = {
  getChapterBySlug: (bookSlug: string, chapterSlug: string) =>
    `/books/${bookSlug}/chapters/${chapterSlug}`,
  getChapters: (bookSlug: string) => `/books/${bookSlug}/chapters`,
};

export const NESTJS_POSTS_ENDPOINTS = {
  getAll: '/posts',
  create: '/posts',
};
