import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { signOut } from 'next-auth/react';
import * as Sentry from '@sentry/nextjs';
import { getAccessToken, setAccessToken } from './token-store';
import { getSessionSingleton } from './session';
import { toast } from 'sonner';
import { ErrorResponseDto } from '../types/response';

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEST_API_URL,
  timeout: 20_000,
});

// Lấy accessToken từ session qua single-flight + Web Locks (xem lib/session.ts).
// Chỉ 1 lần fetch session thật sự chạy; tất cả caller chia sẻ dir=1 promise.
async function getAccessTokenFromSession(): Promise<string | null> {
  const session = await getSessionSingleton();
  if (session?.accessToken) {
    setAccessToken(session.accessToken);
    return session.accessToken;
  }
  return null;
}

clientApi.interceptors.request.use(
  async (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    let accessToken = getAccessToken();
    if (!accessToken) {
      accessToken = await getAccessTokenFromSession();
    }

    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

clientApi.interceptors.response.use(
  (response) => response,
  async (axiosError: AxiosError<ErrorResponseDto>) => {
    const originalRequest = axiosError.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = axiosError.response?.status || 500;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const hadToken = !!originalRequest.headers?.Authorization;

      if (hadToken) {
        // Refresh qua getSessionSingleton(): nếu token vẫn hết hạn, cookie refresh
        // được đánh dấu và session trả về null → thoát đăng nhập.
        const newToken = await getAccessTokenFromSession();

        if (newToken) {
          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return clientApi(originalRequest);
        }

        if (typeof window !== 'undefined') {
          Sentry.captureMessage('RefreshAccessTokenError: Unable to refresh token', {
            level: 'error',
            tags: { event: 'RefreshAccessTokenError' },
          });
          await signOut({ redirect: false });
          window.location.href = '/login?error=SessionExpired';
        }
      }
    }

    if (status === 403 && axiosError.response?.data?.error === 'USER_BANNED') {
      Sentry.captureMessage('USER_BANNED: User was signed out due to ban', {
        level: 'warning',
        tags: { event: 'USER_BANNED' },
        extra: { message: axiosError.response?.data?.message },
      });

      toast.error('Tài khoản đã bị cấm', {
        id: 'user-banned',
        description:
          axiosError.response?.data?.message ||
          'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
        duration: 1000,
      });

      await signOut({ redirect: false });
    }

    return Promise.reject(axiosError);
  },
);

export async function apiRequest<T = unknown>(
  config: AxiosRequestConfig,
): Promise<T> {
  const result = await clientApi(config);
  const responseData = result.data;
  if (responseData && typeof responseData === 'object') {
    if ('meta' in responseData || 'warning' in responseData) {
      return {
        data: responseData.data,
        meta: responseData.meta,
        warning: responseData.warning,
        message: responseData.message,
      } as T;
    }
    if ('data' in responseData && responseData.data !== undefined) {
      return responseData.data as T;
    }
  }
  return responseData as T;
}

export default clientApi;