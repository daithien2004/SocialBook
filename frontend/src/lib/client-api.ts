import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSession, signOut } from 'next-auth/react';
import { getAccessToken } from './token-store';
import { ErrorResponseDto, ResponseDto } from '../types/response';
import { toast } from 'sonner';

const clientApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

clientApi.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export const axiosNextJsBaseQuery =
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
      try {
        const result = await clientApi({
          url,
          method,
          data: body,
          headers,
          params,
        });

        const responseData = result.data as ResponseDto<unknown>;
        if (!responseData.success) {
          return {
            error: {
              status: responseData.statusCode,
              data: {
                success: false,
                statusCode: responseData.statusCode,
                message: responseData.message,
                error: 'Error',
                timestamp: new Date().toISOString(),
                path: responseData.path,
              } as ErrorResponseDto,
            },
          };
        }

        return { data: responseData.data };
      } catch (axiosError) {
        const err = axiosError as AxiosError<ErrorResponseDto>;
        const status = err.response?.status || 500;

        if (status === 401) {
          const hadToken = !!getAccessToken();

          if (hadToken) {
            const session = await getSession();

            if (session?.accessToken) {
              try {
                const retryResult = await clientApi({
                  url,
                  method,
                  data: body,
                  headers: {
                    ...headers,
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                  params,
                });

                const responseData = retryResult.data as ResponseDto<unknown>;
                return { data: responseData.data };
              } catch {
                // Retry thất bại
              }
            }

            if (typeof window !== 'undefined') {
              await signOut({ redirect: false });
              window.location.href = '/login?error=SessionExpired';
            }
          }
        }

        if (status === 403 && err.response?.data?.error === 'USER_BANNED') {
          toast.error('Tài khoản đã bị cấm', {
            description: err.response?.data?.message || 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
            duration: 5000,
          });

          import('next-auth/react').then(({ signOut }) => {
            signOut({ redirect: true, callbackUrl: '/login' });
          });
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