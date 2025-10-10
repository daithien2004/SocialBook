import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/client-api';
import { User } from '../slice/authSlice';
import { BFF_AUTH_ENDPOINTS } from '@/src/constants/client-endpoints';

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

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
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
    signup: builder.mutation<{ otp: string }, SignupRequest>({
      query: (data) => ({
        url: BFF_AUTH_ENDPOINTS.signup,
        method: 'POST',
        body: data,
      }),
    }),

    verifyOtp: builder.mutation<string, VerifyOtpRequest>({
      query: (data) => ({
        url: BFF_AUTH_ENDPOINTS.verifyOtp,
        method: 'POST',
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<string, ForgotPasswordRequest>({
      query: (data) => ({
        url: BFF_AUTH_ENDPOINTS.forgotPassword,
        method: 'POST',
        body: data,
      }),
    }),

    resetPassword: builder.mutation<string, ResetPasswordRequest>({
      query: (data) => ({
        url: BFF_AUTH_ENDPOINTS.resetPassword,
        method: 'POST',
        body: data,
      }),
    }),

    getProfile: builder.query<User, void>({
      query: () => ({
        url: BFF_AUTH_ENDPOINTS.profile,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    resendOtp: builder.mutation<string, ResendOtpRequest>({
      query: (data) => ({
        url: BFF_AUTH_ENDPOINTS.resendOtp,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useSignupMutation,
  useVerifyOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useResendOtpMutation,
} = authApi;
