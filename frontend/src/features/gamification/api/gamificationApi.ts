import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/src/lib/nestjs-client-api';
import { NESTJS_GAMIFICATION_ENDPOINTS } from '@/src/constants/server-endpoints';
import { Achievement, GamificationStats } from '../types/gamification.interface';

export const gamificationApi = createApi({
  reducerPath: 'gamificationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['GamificationStats', 'Achievements', 'Leaderboard', 'DailyGoals'],
  endpoints: (builder) => ({
    // getGamificationStats: builder.query<GamificationStats, void>({
    //   query: () => ({ url: NESTJS_GAMIFICATION_ENDPOINTS.stats, method: 'GET' }),
    //   providesTags: ['GamificationStats'],
    // }),
    // getAchievements: builder.query<Achievement[], void>({
    //   query: () => ({
    //     url: NESTJS_GAMIFICATION_ENDPOINTS.achievements,
    //     method: 'GET',
    //   }),
    //   providesTags: ['Achievements'],
    // }),
    // getLeaderboard: builder.query<any, { period: string; category: string }>({
    //   query: (params) => ({
    //     url: NESTJS_GAMIFICATION_ENDPOINTS.leaderboard,
    //     method: 'GET',
    //     params,
    //   }),
    //   providesTags: ['Leaderboard'],
    // }),
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
      invalidatesTags: ['GamificationStats'],
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
  // useGetGamificationStatsQuery,
  // useGetAchievementsQuery,
  // useGetLeaderboardQuery,
  useGetStreakQuery,
  useCheckInStreakMutation,
  useGetDailyGoalQuery,
  useGetUserAchievementsQuery,
} = gamificationApi;
