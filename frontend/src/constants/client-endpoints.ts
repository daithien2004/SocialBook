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
};

export const BFF_BOOKS_ENDPOINTS = {
  getAll: '/books',
  getBySlug: (bookSlug: string) => `/books/${bookSlug}`,
  createBook: '/books',
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
};
