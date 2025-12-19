import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { ErrorResponseDto, ResponseDto } from '../types/response';
import { toast } from 'sonner';
import { getSession } from 'next-auth/react';

let authToastTimer: NodeJS.Timeout | null = null;

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

clientApi.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
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

        return { data: responseData.data ?? null };
      } catch (axiosError) {
        const err = axiosError as AxiosError<ErrorResponseDto>;
        const status = err.response?.status || 500;

        // Xử lý lỗi 401 (Unauthorized)
        if (status === 401) {
          // Xóa session trên client nếu có (optional)
          // signOut({ redirect: false }); 
          
          // Debounce: Chỉ hiện toast sau khi "bão" lỗi 401 kết thúc
          if (authToastTimer) clearTimeout(authToastTimer);

          authToastTimer = setTimeout(() => {
            toast.dismiss(); // Xóa sạch các thông báo khác
            
            // Delay nhỏ để đảm bảo dismiss đã xong trước khi hiện cái mới
            setTimeout(() => {
              toast.info('Vui lòng đăng nhập để tiếp tục', {
                id: 'auth-required', // Tránh trùng lặp
                description: 'Bạn có muốn về trang đăng nhập không?',
                action: {
                  label: 'Đăng nhập',
                  onClick: () => {
                     window.location.href = '/login';
                  },
                },
                duration: 8000,
              });
              authToastTimer = null;
            }, 100);
          }, 500);
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