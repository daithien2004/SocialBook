import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { env } from '@/env';
import { refreshAuthSession } from '@/lib/auth-refresh';
import { getCsrfToken } from '@/lib/utils';
import { ErrorResponseDto } from '../types/response';
import { unwrapApiResponse } from './api-response';

const clientApi = axios.create({
  baseURL: env.NEXT_PUBLIC_NEST_API_URL,
  timeout: 20_000,
  withCredentials: true,
});

clientApi.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

clientApi.interceptors.response.use(
  (response) => response,
  async (axiosError: AxiosError<ErrorResponseDto>) => {
    const originalRequest = axiosError.config as
      | (AxiosRequestConfig & { _retry?: boolean; skipAuthRedirect?: boolean })
      | undefined;
    const status = axiosError.response?.status || 500;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const ok = await refreshAuthSession();
      if (ok) {
        return clientApi(originalRequest);
      }
      if (!originalRequest.skipAuthRedirect && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?error=SessionExpired';
      }
    }

    if (status === 403 && (axiosError.response?.data as { error?: string })?.error === 'USER_BANNED') {
      toast.error('Tài khoản đã bị cấm', {
        id: 'user-banned',
        description:
          axiosError.response?.data?.message ||
          'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
        duration: 1000,
      });
    }

    return Promise.reject(axiosError);
  },
);

export type ApiRequestConfig = AxiosRequestConfig & {
  skipAuthRedirect?: boolean;
};

export async function apiRequest<T = unknown>(
  config: ApiRequestConfig,
): Promise<T> {
  const result = await clientApi(config);
  return unwrapApiResponse<T>(result.data);
}

export default clientApi;