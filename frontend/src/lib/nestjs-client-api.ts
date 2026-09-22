import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { getAccessToken, setAccessToken } from './token-store';
import { toast } from 'sonner';
import { ErrorResponseDto } from '../types/response';

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEST_API_URL,
  withCredentials: true,
  timeout: 20_000,
});

// Mutex: đảm bảo chỉ 1 lần refresh token / initial fetch token chạy tại 1 thời điểm.
let refreshingPromise: Promise<string | null> | null = null;
let initTokenPromise: Promise<string | null> | null = null;

clientApi.interceptors.request.use(
  async (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    let accessToken = getAccessToken();
    if (!accessToken) {
      if (!initTokenPromise) {
        initTokenPromise = getSession()
          .then((session) => {
            if (session?.accessToken) {
              setAccessToken(session.accessToken);
              return session.accessToken;
            }
            return null;
          })
          .finally(() => {
            initTokenPromise = null;
          });
      }
      accessToken = await initTokenPromise;
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
        if (!refreshingPromise) {
          refreshingPromise = getSession()
            .then((s) => {
              if (s?.accessToken) {
                setAccessToken(s.accessToken);
                return s.accessToken;
              }
              return null;
            })
            .finally(() => {
              refreshingPromise = null;
            });
        }

        const newToken = await refreshingPromise;

        if (newToken) {
          if (!originalRequest.headers) {
            originalRequest.headers = {};
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return clientApi(originalRequest);
        }

        if (typeof window !== 'undefined') {
          await signOut({ redirect: false });
          window.location.href = '/login?error=SessionExpired';
        }
      }
    }

    if (status === 403 && axiosError.response?.data?.error === 'USER_BANNED') {
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