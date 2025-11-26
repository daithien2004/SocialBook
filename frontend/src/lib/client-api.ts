import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { ErrorResponseDto, ResponseDto } from '../types/response';
import { toast } from 'sonner';

// Client chỉ gọi Next.js API routes (BFF)
const clientApi = axios.create({
  baseURL: '/api', // ← Same origin, no CORS
  withCredentials: true, // ← Tự động gửi cookies
});

clientApi.interceptors.request.use(
  (config) => {
    // Nếu không phải FormData, mặc định là JSON
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    // Nếu là FormData, axios sẽ tự động set Content-Type với boundary
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