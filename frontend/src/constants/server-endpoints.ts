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
  bookAndFirstChapter: (bookSlug: string) => `/books/${bookSlug}/first-chapter`,
  getMetadataNextChapter: (bookSlug: string, currentOrderIndex: number) =>
    `/books/${bookSlug}/next-chapter?currentOrderIndex=${currentOrderIndex}`,
  chapterContent: (chapterId: string) =>
    `/books/chapter/by-id/${chapterId}/content`,
};
