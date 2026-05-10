import { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { getAccessToken } from './token-store';
import { toast } from 'sonner';
import { ErrorResponseDto } from '../types/response';

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEST_API_URL,
  withCredentials: true,
});

clientApi.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    const accessToken = getAccessToken();
    if (accessToken) {
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

        // Backend returns { message, data } or { message, data, meta }
        const responseData = result.data;

        if (method !== 'GET' && responseData?.message) {
          //toast.success(responseData.message);
        }

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
          const session = await getSession(); // Kích hoạt refresh ở server side

          if (session?.accessToken) {
            // Nếu lấy được token mới, thử lại request ngay lập tức
            try {
              const retryResult = await clientApi({
                url,
                method,
                data: body,
                headers: {
                  ...requestHeaders,
                  Authorization: `Bearer ${session.accessToken}`,
                },
                params,
              });

              const responseData = retryResult.data;
              return { data: responseData.data !== undefined ? responseData.data : responseData };
            } catch (retryError) {
              // Thử lại vẫn thất bại, tiếp tục xử lý báo lỗi bên dưới
            }
          } else {
            // Refresh token không thành công (vd: refresh token cũng hết hạn)
            await signOut({ redirect: false });
            window.location.href = '/login?error=SessionExpired';
            toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
          }
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