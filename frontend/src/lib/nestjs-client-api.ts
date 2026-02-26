import { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { ErrorResponseDto, ResponseDto } from '../types/response';
const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEST_API_URL,
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

        // Backend returns { message, data } or { message, data, meta }
        const responseData = result.data;

        if (method !== 'GET' && responseData?.message) {
          toast.success(responseData.message);
        }
        if (responseData.meta !== undefined) {
          return { data: { data: responseData.data, meta: responseData.meta } };
        }
        return { data: responseData.data !== undefined ? responseData.data : responseData };
      } catch (axiosError) {
        const err = axiosError as AxiosError<ErrorResponseDto>;
        const status = err.response?.status || 500;

        if (status === 401) {
          toast.info('Vui lòng đăng nhập để tiếp tục', {
            id: 'auth-required',
            description: 'Bạn có muốn về trang đăng nhập không?',
            action: {
              label: 'Đăng nhập',
              onClick: () => {
                window.location.href = '/login';
              },
            },
          });
        }

        if (status === 403 && err.response?.data?.error === 'USER_BANNED') {
          toast.error('Tài khoản đã bị cấm', {
            id: 'user-banned',
            description: err.response?.data?.message || 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
            duration: 1000,
          });


          await signOut({ redirect: false })
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