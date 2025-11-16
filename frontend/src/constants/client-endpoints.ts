
 const BFF_AUTH_ENDPOINTS = {
  signup: '/auth/signup',
  verifyOtp: '/auth/verify-otp',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  profile: '/auth/profile',
  resendOtp: '/auth/resend-otp',
};

export const BFF_POSTS_ENDPOINTS = {
  getAll: '/posts',
};

export const BFF_BOOKS_ENDPOINTS = {
  getAll: '/books',
  getBySlug: (slug: string) => `/books/${slug}`,
};

export const BFF_COMMENTS_ENDPOINTS = {
  getCommentsByTarget: '/comments',

};