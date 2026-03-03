import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_ONBOARDING_ENDPOINTS } from '@/constants/server-endpoints';
import { OnboardingStatus, UpdateStepDto } from '../types/onboarding.interface';

export const onboardingApi = createApi({
  reducerPath: 'onboardingApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Onboarding'],
  endpoints: (builder) => ({
    getOnboardingStatus: builder.query<OnboardingStatus, void>({
      query: () => ({ url: NESTJS_ONBOARDING_ENDPOINTS.status, method: 'GET' }),
      providesTags: ['Onboarding'],
    }),
    startOnboarding: builder.mutation<void, void>({
      query: () => ({ url: NESTJS_ONBOARDING_ENDPOINTS.start, method: 'POST' }),
      invalidatesTags: ['Onboarding'],
    }),
    updateOnboardingStep: builder.mutation<void, UpdateStepDto>({
      query: (body) => ({
        url: NESTJS_ONBOARDING_ENDPOINTS.updateStep,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Onboarding'],
    }),
    completeOnboarding: builder.mutation<void, void>({
      query: () => ({
        url: NESTJS_ONBOARDING_ENDPOINTS.complete,
        method: 'POST',
      }),
      invalidatesTags: ['Onboarding'],
    }),
  }),
});

export const {
  useGetOnboardingStatusQuery,
  useStartOnboardingMutation,
  useUpdateOnboardingStepMutation,
  useCompleteOnboardingMutation,
} = onboardingApi;
