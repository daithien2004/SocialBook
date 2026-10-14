import type {
  BookStatsReadModel,
  ChapterEngagementReadModel,
  GeographicReadModel,
  GrowthMetricReadModel,
  OverviewStatsReadModel,
  ReadingHeatmapReadModel,
  ReadingSpeedReadModel,
  UserLocationSummaryReadModel,
  UserStatsReadModel,
} from '@/modules/statistics/application/read-models/statistics.read-model';

export abstract class StatisticsReadRepository {
  abstract getOverviewStats(
    recentSince: Date,
    previousSince: Date,
  ): Promise<OverviewStatsReadModel>;
  abstract getUserStats(recentSince: Date): Promise<UserStatsReadModel>;
  abstract getBookStats(): Promise<BookStatsReadModel>;
  abstract getGrowthStats(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<GrowthMetricReadModel[]>;
  abstract getGeographicDistribution(): Promise<GeographicReadModel[]>;
  abstract checkUserLocations(): Promise<UserLocationSummaryReadModel>;
  abstract getReadingHeatmap(): Promise<ReadingHeatmapReadModel[]>;
  abstract getChapterEngagement(
    limit: number,
  ): Promise<ChapterEngagementReadModel[]>;
  abstract getReadingSpeed(days: number): Promise<ReadingSpeedReadModel[]>;
  abstract countActiveUsers(lastFiveMinutes: Date): Promise<number>;
}
