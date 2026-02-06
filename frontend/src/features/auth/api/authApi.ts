import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_AUTH_ENDPOINTS } from '@/src/constants/server-endpoints';
import { User } from 'next-auth';
import { SignupRequest, VerifyOtpRequest, ForgotPasswordRequest, ResetPasswordRequest, ResendOtpRequest } from '../types/auth.type';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    signup: builder.mutation<{ otp: string }, SignupRequest>({
      query: (data) => ({
        url: NESTJS_AUTH_ENDPOINTS.signup,
        method: 'POST',
        body: data,
      }),
    }),

    verifyOtp: builder.mutation<string, VerifyOtpRequest>({
      query: (data) => ({
        url: NESTJS_AUTH_ENDPOINTS.verifyOtp,
        method: 'POST',
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<string, ForgotPasswordRequest>({
      query: (data) => ({
        url: NESTJS_AUTH_ENDPOINTS.forgotPassword,
        method: 'POST',
        body: data,
      }),
    }),

    resetPassword: builder.mutation<string, ResetPasswordRequest>({
      query: (data) => ({
        url: NESTJS_AUTH_ENDPOINTS.resetPassword,
        method: 'POST',
        body: data,
      }),
    }),

    getProfile: builder.query<User, void>({
      query: () => ({
        url: NESTJS_AUTH_ENDPOINTS.profile,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    resendOtp: builder.mutation<{ message: string; data: { resendCooldown: number } }, ResendOtpRequest>({
      query: (data) => ({
        url: NESTJS_AUTH_ENDPOINTS.resendOtp,
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
