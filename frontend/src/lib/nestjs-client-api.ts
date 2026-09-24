import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { env } from '@/env';
import { ErrorResponseDto } from '../types/response';

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
    return config;
  },
  (error) => Promise.reject(error),
);

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    return res.status < 400;
  } catch {
    return false;
  }
}

clientApi.interceptors.response.use(
  (response) => response,
  async (axiosError: AxiosError<ErrorResponseDto>) => {
    const originalRequest = axiosError.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = axiosError.response?.status || 500;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const ok = await refreshAccessToken();
      if (ok) {
        return clientApi(originalRequest);
      }
      if (typeof window !== 'undefined') {
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