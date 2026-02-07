import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/src/modules/users/domain/repositories/user.repository.interface';
import { IBookRepository } from '@/src/modules/books/domain/repositories/book.repository.interface';
import { IPostRepository } from '@/src/modules/posts/domain/repositories/post.repository.interface';
import { IProgressRepository } from '@/src/modules/progress/domain/repositories/progress.repository.interface';
import { 
    ReadingHeatmapData,
    ChapterEngagementData,
    ReadingSpeedData,
    GrowthMetric,
    GeographicData,
    ActiveUsersData
} from '../../domain/models/statistics.model';

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
