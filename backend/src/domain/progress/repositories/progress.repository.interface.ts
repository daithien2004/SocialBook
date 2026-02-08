import { ReadingHeatmapData, ChapterEngagementData, ReadingSpeedData, ActiveUsersData } from '@/domain/statistics/models/statistics.model';

export abstract class IProgressRepository {
    abstract getReadingHeatmap(): Promise<ReadingHeatmapData[]>;
    abstract getChapterEngagement(limit: number): Promise<ChapterEngagementData[]>;
    abstract getReadingSpeed(days: number): Promise<ReadingSpeedData[]>;
    abstract countActiveUsers(lastFiveMinutes: Date): Promise<number>;
}

