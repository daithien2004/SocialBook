import { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { getAccessToken, setAccessToken } from './token-store';
import { toast } from 'sonner';
import { ErrorResponseDto } from '../types/response';

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEST_API_URL,
  withCredentials: true,
});

// Mutex: đảm bảo chỉ 1 lần refresh token chạy tại 1 thời điểm.
// Các request 401 song song sẽ chờ chung promise này thay vì
// mỗi cái tự gọi getSession() và gây race condition trên hashedRt.
let refreshingPromise: Promise<string | null> | null = null;

clientApi.interceptors.request.use(
  async (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    let accessToken = getAccessToken();
    if (!accessToken) {
      const session = await getSession();
      if (session?.accessToken) {
        accessToken = session.accessToken;
        setAccessToken(accessToken);
      }
    }

    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      body?: AxiosRequestConfig['data'];
      headers?: AxiosRequestConfig['headers'];
      params?: AxiosRequestConfig['params'];
    },
    unknown,
    { status: number; data: ErrorResponseDto }
  > =>
    async ({ url, method = 'GET', body, headers, params }) => {
      const requestHeaders: Record<string, string> = {
        ...(headers as Record<string, string>),
      };

      try {
        const accessToken = getAccessToken();

        if (accessToken) {
          requestHeaders.Authorization = `Bearer ${accessToken}`;
        }

        const result = await clientApi({
          url,
          method,
          data: body,
          headers: requestHeaders,
          params,
        });

        const responseData = result.data;

        if (responseData.meta !== undefined || responseData.warning !== undefined) {
          return {
            data: {
              data: responseData.data,
              meta: responseData.meta,
              warning: responseData.warning,
              message: responseData.message,
            },
          };
        }
        return { data: responseData.data !== undefined ? responseData.data : responseData };
      } catch (axiosError) {
        const err = axiosError as AxiosError<ErrorResponseDto>;
        const status = err.response?.status || 500;

        if (status === 401) {
          const hadToken = !!requestHeaders.Authorization;

          if (hadToken) {
            // Nếu chưa có refresh đang chạy thì khởi tạo, ngược lại dùng chung promise
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
              try {
                const retryResult = await clientApi({
                  url,
                  method,
                  data: body,
                  headers: {
                    ...requestHeaders,
                    Authorization: `Bearer ${newToken}`,
                  },
                  params,
                });

                const responseData = retryResult.data;
                return { data: responseData.data !== undefined ? responseData.data : responseData };
              } catch {
                // Retry thất bại
              }
            }

            // Chỉ redirect login nếu request có gửi token (authenticated request)
            if (typeof window !== 'undefined') {
              await signOut({ redirect: false });
              window.location.href = '/login?error=SessionExpired';
            }
          }
          // Guest không có token → không redirect, chỉ trả error
        }

        if (status === 403 && err.response?.data?.error === 'USER_BANNED') {
          toast.error('Tài khoản đã bị cấm', {
            id: 'user-banned',
            description: err.response?.data?.message || 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
            duration: 1000,
          });

          await signOut({ redirect: false });
        }

        return {
          error: {
            status,
            data: err.response?.data || {
              success: false,
              statusCode: status,
              message: err.message,
              error: 'Client Error',
              timestamp: new Date().toISOString(),
              path: url,
            },
          },
        };
      }
    };

export default clientApi;