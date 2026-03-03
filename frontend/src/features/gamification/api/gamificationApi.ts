import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import { NESTJS_GAMIFICATION_ENDPOINTS } from '@/constants/server-endpoints';

export const gamificationApi = createApi({
  reducerPath: 'gamificationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['GamificationStats', 'Achievements', 'DailyGoals'],
  endpoints: (builder) => ({
    getStreak: builder.query<any, void>({
      query: () => ({
        url: NESTJS_GAMIFICATION_ENDPOINTS.streak,
        method: 'GET',
      }),
      providesTags: ['GamificationStats'],
    }),
    checkInStreak: builder.mutation<any, void>({
      query: () => ({
        url: NESTJS_GAMIFICATION_ENDPOINTS.streakCheckIn,
        method: 'POST',
      }),
      invalidatesTags: ['GamificationStats', 'Achievements'],
    }),
    getDailyGoal: builder.query<any, void>({
      query: () => ({
        url: NESTJS_GAMIFICATION_ENDPOINTS.dailyGoals,
        method: 'GET',
      }),
      providesTags: ['DailyGoals'],
    }),
    getUserAchievements: builder.query<any, void>({
      query: () => ({
         url: NESTJS_GAMIFICATION_ENDPOINTS.achievements,
         method: 'GET',
      }),
      providesTags: ['Achievements'],
    }),
  }),
});

export const {
  useGetStreakQuery,
  useCheckInStreakMutation,
  useGetDailyGoalQuery,
  useGetUserAchievementsQuery,
} = gamificationApi;
