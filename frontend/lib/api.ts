import Axios, { AxiosError } from 'axios';
import { AUTH_ENDPOINTS } from '@/constants/api';
import { AuthResponse } from '@/types/auth';

const api = Axios.create({
  baseURL: AUTH_ENDPOINTS.signup.split('/auth')[0],
  withCredentials: true, // Gửi cookie cùng yêu cầu
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes('refresh')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await api.post<AuthResponse>(AUTH_ENDPOINTS.refresh);
          isRefreshing = false;
          processQueue(null, data.accessToken);
          originalRequest.headers[
            'Authorization'
          ] = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError as AxiosError);
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }
    return Promise.reject(error);
  }
);

export const signup = async (dto: { email: string; password: string }) => {
  const { data } = await api.post<AuthResponse>(AUTH_ENDPOINTS.signup, dto);
  return data;
};

export const login = async (dto: { email: string; password: string }) => {
  const { data } = await api.post<AuthResponse>(AUTH_ENDPOINTS.login, dto);
  return data;
};

export const refreshToken = async () => {
  const { data } = await api.post<AuthResponse>(AUTH_ENDPOINTS.refresh);
  return data;
};

export default api;
