import { Injectable } from '@nestjs/common';
import { IProgressRepository } from '@/domain/progress/repositories/progress.repository.interface';
import { 
    ReadingHeatmapData,
    ChapterEngagementData,
    ReadingSpeedData,
    ActiveUsersData
} from '@/domain/statistics/models/statistics.model';

@Injectable()
export class GetEngagementStatsUseCase {
    constructor(
        private readonly progressRepository: IProgressRepository,
    ) {}

    async getReadingHeatmap(): Promise<ReadingHeatmapData[]> {
        return this.progressRepository.getReadingHeatmap();
    }

    async getChapterEngagement(limit: number = 10): Promise<ChapterEngagementData[]> {
        return this.progressRepository.getChapterEngagement(limit);
    }

    async getReadingSpeed(days: number = 30): Promise<ReadingSpeedData[]> {
        return this.progressRepository.getReadingSpeed(days);
    }
    
    async getActiveUsers(): Promise<ActiveUsersData> {
         const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
         const count = await this.progressRepository.countActiveUsers(fiveMinutesAgo);
         return {
             count,
             timestamp: new Date().toISOString()
         };
    }
}

