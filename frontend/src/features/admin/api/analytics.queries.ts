import { analyticsKeys } from '@/lib/query-keys';
import {
  getActiveUsers,
  getBookStats,
  getChapterEngagement,
  getGeographicDistribution,
  getGrowthStats,
  getOverviewStats,
  getReadingHeatmap,
  getReadingSpeed,
} from './analytics.api';
import type {
  ActiveUsersData,
  ChapterEngagementData,
  GeographicData,
  ReadingHeatmapData,
  ReadingSpeedData,
} from '../types/admin.interface';
import type { BookStats, GrowthMetric, OverviewStats } from '../types/dashboard.types';

export const analyticsQueries = {
  readingHeatmap: () => ({
    queryKey: analyticsKeys.readingHeatmap(),
    queryFn: (): Promise<ReadingHeatmapData[]> => getReadingHeatmap(),
  }),
  chapterEngagement: (limit?: number) => ({
    queryKey: analyticsKeys.chapterEngagement(limit ?? 10),
    queryFn: (): Promise<ChapterEngagementData[]> =>
      getChapterEngagement(limit),
  }),
  readingSpeed: (days?: number) => ({
    queryKey: analyticsKeys.readingSpeed(days),
    queryFn: (): Promise<ReadingSpeedData[]> => getReadingSpeed(days),
  }),
  geographic: () => ({
    queryKey: analyticsKeys.geographic(),
    queryFn: (): Promise<GeographicData[]> => getGeographicDistribution(),
  }),
  activeUsers: () => ({
    queryKey: analyticsKeys.activeUsers(),
    queryFn: (): Promise<ActiveUsersData> => getActiveUsers(),
  }),
  overviewStats: () => ({
    queryKey: analyticsKeys.overviewStats(),
    queryFn: (): Promise<OverviewStats> => getOverviewStats(),
  }),
  growthStats: ({ days, groupBy }: { days: number; groupBy?: string }) => ({
    queryKey: analyticsKeys.growthStats(days, groupBy ?? 'day'),
    queryFn: (): Promise<GrowthMetric[]> => getGrowthStats({ days, groupBy }),
  }),
  bookStats: () => ({
    queryKey: analyticsKeys.bookStats(),
    queryFn: (): Promise<BookStats> => getBookStats(),
  }),
};