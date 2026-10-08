import { Injectable } from '@nestjs/common';
import { IProgressRepository } from '@/modules/statistics/domain/repositories/progress.repository.interface';
import { IUserRepository } from '@/modules/users/domain/public-api';
import {
  ReadingHeatmapData,
  ChapterEngagementData,
  ReadingSpeedData,
  ActiveUsersData,
  GeographicData,
} from '@/modules/statistics/domain/read-models/statistics.model';

@Injectable()
export class GetEngagementStatsHandler {
  constructor(
    private readonly progressRepository: IProgressRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async getReadingHeatmap(): Promise<ReadingHeatmapData[]> {
    return this.progressRepository.getReadingHeatmap();
  }

  async getChapterEngagement(
    limit: number = 10,
  ): Promise<ChapterEngagementData[]> {
    return this.progressRepository.getChapterEngagement(limit);
  }

  async getReadingSpeed(days: number = 30): Promise<ReadingSpeedData[]> {
    return this.progressRepository.getReadingSpeed(days);
  }

  async getActiveUsers(): Promise<ActiveUsersData> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count =
      await this.progressRepository.countActiveUsers(fiveMinutesAgo);
    return {
      count,
      timestamp: new Date().toISOString(),
    };
  }

  async getGeographicDistribution(): Promise<GeographicData[]> {
    return this.userRepository.getGeographicDistribution();
  }
}
