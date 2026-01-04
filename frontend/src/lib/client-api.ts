import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
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
              data: responseData as any,
            },
          };
        }

        return { data: responseData.data };
      } catch (axiosError) {
        const err = axiosError as AxiosError<ErrorResponseDto>;
        const status = err.response?.status || 500;

        // Xử lý lỗi 401 (Unauthorized)
        if (status === 401) {
          toast.error('Vui lòng đăng nhập để tiếp tục');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }

        if (status === 403 && (err.response?.data as any)?.error === 'USER_BANNED') {
          toast.error('Tài khoản đã bị cấm', {
            description: (err.response?.data as any)?.message || 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
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