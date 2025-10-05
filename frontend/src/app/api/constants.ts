export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  signup: '/auth/signup',
  verifyOtp: '/auth/verify-otp',
  googleCallback: '/auth/google/callback',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  refresh: '/auth/refresh',
  profile: '/auth/profile',
  logout: '/auth/logout',
} as const;

export const BOOKS_ENDPOINTS = {
  bookAndFirstChapter: (bookSlug: string) =>
    `${API_BASE_URL}/books/${bookSlug}/first-chapter`,
  getMetadataNextChapter: (bookSlug: string, currentOrderIndex: number) =>
    `${API_BASE_URL}/books/${bookSlug}/next-chapter?currentOrderIndex=${currentOrderIndex}`,
  chapterContent: (chapterId: string) =>
    `${API_BASE_URL}/books/chapter/by-id/${chapterId}/content`,
};
