import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { ErrorResponseDto, ResponseDto } from '../types/response';

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
      return {
        error: {
          status: err.response?.status || 500,
          data: err.response?.data || {
            success: false,
            statusCode: err.response?.status || 500,
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
