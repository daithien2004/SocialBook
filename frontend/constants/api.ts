export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const AUTH_ENDPOINTS = {
  signup: `${API_BASE_URL}/auth/signup`,
  login: `${API_BASE_URL}/auth/login`,
  refresh: `${API_BASE_URL}/auth/refresh`,
};
