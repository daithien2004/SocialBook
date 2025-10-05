// store/api/authApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/app/api';
import { AUTH_ENDPOINTS } from '@/src/app/api/constants';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}
export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface GoogleAuthRequest {
  username: string;
  email: string;
  googleId: string;
  avatar: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: AUTH_ENDPOINTS.login,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    signup: builder.mutation<{ otp: string }, SignupRequest>({
      query: (data) => ({
        url: AUTH_ENDPOINTS.signup,
        method: 'POST',
        body: data,
      }),
    }),

    verifyOtp: builder.mutation<string, VerifyOtpRequest>({
      query: (data) => ({
        url: AUTH_ENDPOINTS.verifyOtp,
        method: 'POST',
        body: data,
      }),
    }),

    googleAuth: builder.mutation<AuthResponse, GoogleAuthRequest>({
      query: (data) => ({
        url: AUTH_ENDPOINTS.googleCallback,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    forgotPassword: builder.mutation<string, ForgotPasswordRequest>({
      query: (data) => ({
        url: AUTH_ENDPOINTS.forgotPassword,
        method: 'POST',
        body: data,
      }),
    }),

    resetPassword: builder.mutation<string, ResetPasswordRequest>({
      query: (data) => ({
        url: AUTH_ENDPOINTS.resetPassword,
        method: 'POST',
        body: data,
      }),
    }),

    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: AUTH_ENDPOINTS.refresh,
        method: 'POST',
      }),
    }),

    getProfile: builder.query<User, void>({
      query: () => ({
        url: AUTH_ENDPOINTS.profile,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: AUTH_ENDPOINTS.logout,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useVerifyOtpMutation,
  useGoogleAuthMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useGetProfileQuery,
  useLogoutMutation,
} = authApi;
