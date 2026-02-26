import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { GrowthMetric } from '@/domain/statistics/models/statistics.model';

@Injectable()
export class GetGrowthStatsUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly bookRepository: IBookRepository,
        private readonly postRepository: IPostRepository,
    ) { }

    async execute(days: number = 30, groupBy: string = 'day'): Promise<GrowthMetric[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [userGrowth, bookGrowth, postGrowth] = await Promise.all([
            this.userRepository.getGrowthMetrics(startDate, groupBy),
            this.bookRepository.getGrowthMetrics(startDate, groupBy),
            this.postRepository.getGrowthMetrics(startDate, groupBy),
        ]);

        // Build a unified map keyed by date string
        const metricsMap = new Map<string, GrowthMetric>();

        for (const entry of userGrowth) {
            metricsMap.set(entry._id, { date: entry._id, users: entry.count, books: 0, posts: 0 });
        }
        for (const entry of bookGrowth) {
            const existing = metricsMap.get(entry._id);
            if (existing) {
                existing.books = entry.count;
            } else {
                metricsMap.set(entry._id, { date: entry._id, users: 0, books: entry.count, posts: 0 });
            }
        }
        for (const entry of postGrowth) {
            const existing = metricsMap.get(entry._id);
            if (existing) {
                existing.posts = entry.count;
            } else {
                metricsMap.set(entry._id, { date: entry._id, users: 0, books: 0, posts: entry.count });
            }
        }

        // Sort by date ascending
        return Array.from(metricsMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date),
        );
    }
}
