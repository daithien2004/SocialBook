import Axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS } from './constants';
import { AuthResponse } from './types/response';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { ErrorResponseDto, ResponseDto } from './types/response';

const api = Axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Gửi cookie cùng yêu cầu
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponseDto>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes('refresh') &&
      !originalRequest._retry // Tránh loop vô hạn
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data: responseData } = await api.post<
            ResponseDto<AuthResponse>
          >(AUTH_ENDPOINTS.refresh);
          const accessToken = responseData.data.accessToken; // Lấy từ ResponseDto

          isRefreshing = false;
          processQueue(null, accessToken);

          // Cập nhật header cho request gốc
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          originalRequest._retry = true; // Đánh dấu đã retry

          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError as AxiosError);
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }
    return Promise.reject(error);
  }
);

// Định nghĩa axiosBaseQuery cho RTK Query
export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      body?: AxiosRequestConfig['data'];
      headers?: AxiosRequestConfig['headers'];
    },
    unknown,
    { status: number; data: ErrorResponseDto }
  > =>
  async ({ url, method = 'GET', body, headers }) => {
    try {
      const result = await api({
        url,
        method,
        data: body,
        headers,
      });
      // Parse ResponseDto từ backend
      const responseData = result.data as ResponseDto<unknown>;
      if (!responseData.success) {
        // Nếu backend trả success: false (hiếm, nhưng để robust)
        return {
          error: {
            status: responseData.statusCode,
            data: responseData as any, // Cast để tương thích
          },
        };
      }

      // Trả data từ ResponseDto
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

export default api;
