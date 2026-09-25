import { apiRequest } from '@/lib/api-client';
import {
  NESTJS_ANALYTICS_ENDPOINTS,
  NESTJS_CHROMA_ENDPOINTS,
  NESTJS_STATISTICS_ENDPOINTS,
} from '@/constants/server-endpoints';
import type {
  ActiveUsersData,
  ChapterEngagementData,
  GeographicData,
  ReadingHeatmapData,
  ReadingSpeedData,
} from '../types/admin.interface';
import type { BookStats, GrowthMetric, OverviewStats } from '../types/dashboard.types';

export async function getReadingHeatmap(): Promise<ReadingHeatmapData[]> {
  return apiRequest<ReadingHeatmapData[]>({
    url: NESTJS_ANALYTICS_ENDPOINTS.getReadingHeatmap,
    method: 'GET',
  });
}

export async function getChapterEngagement(
  limit?: number,
): Promise<ChapterEngagementData[]> {
  const effectiveLimit = limit ?? 10;
  return apiRequest<ChapterEngagementData[]>({
    url: NESTJS_ANALYTICS_ENDPOINTS.getChapterEngagement,
    method: 'GET',
    params: { limit: effectiveLimit },
  });
}

export async function getReadingSpeed(
  days?: number,
): Promise<ReadingSpeedData[]> {
  return apiRequest<ReadingSpeedData[]>({
    url: NESTJS_ANALYTICS_ENDPOINTS.getReadingSpeed,
    method: 'GET',
    params: { days },
  });
}

export async function getGeographicDistribution(): Promise<GeographicData[]> {
  return apiRequest<GeographicData[]>({
    url: NESTJS_ANALYTICS_ENDPOINTS.getGeographicDistribution,
    method: 'GET',
  });
}

export async function getActiveUsers(): Promise<ActiveUsersData> {
  return apiRequest<ActiveUsersData>({
    url: NESTJS_ANALYTICS_ENDPOINTS.getActiveUsers,
    method: 'GET',
  });
}

export async function seedReadingHistory(params: {
  days?: number;
}): Promise<void> {
  return apiRequest<void>({
    url: NESTJS_ANALYTICS_ENDPOINTS.seedReadingHistory,
    method: 'POST',
    params: { days: params.days ?? 30 },
  });
}

export async function getOverviewStats(): Promise<OverviewStats> {
  return apiRequest<OverviewStats>({
    url: NESTJS_STATISTICS_ENDPOINTS.overview,
    method: 'GET',
  });
}

export async function getGrowthStats(params: {
  days: number;
  groupBy?: string;
}): Promise<GrowthMetric[]> {
  const { days, groupBy = 'day' } = params;
  return apiRequest<GrowthMetric[]>({
    url: `${NESTJS_STATISTICS_ENDPOINTS.growth(days)}&groupBy=${groupBy}`,
    method: 'GET',
  });
}

export async function getBookStats(): Promise<BookStats> {
  return apiRequest<BookStats>({
    url: NESTJS_STATISTICS_ENDPOINTS.books,
    method: 'GET',
  });
}

export async function reindexAll(): Promise<void> {
  return apiRequest<void>({
    url: NESTJS_CHROMA_ENDPOINTS.reindexAll,
    method: 'POST',
  });
}