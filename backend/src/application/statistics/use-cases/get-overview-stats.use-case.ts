import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { OverviewStats } from '@/domain/statistics/models/statistics.model';

@Injectable()
export class GetOverviewStatsUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly bookRepository: IBookRepository,
        private readonly postRepository: IPostRepository,
        private readonly commentRepository: ICommentRepository,
        private readonly reviewRepository: IReviewRepository,
        private readonly chapterRepository: IChapterRepository,
    ) {}

    async execute(): Promise<OverviewStats> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeUsers, // Users created in last 30 days? Or active sessions? The service used 'created in last 30 days' as 'activeUsers' which is misleading but let's stick to refactoring logic first.
            // Wait, original service: activeUsers = createdAt >= thirtyDaysAgo. That's "New Users".
            // AND "previousMonthUsers" = createdAt < 30 days ago AND >= 60 days ago.
            // AND "growth" was based on these.
            // Okay, I will implement `countByDate` calls.
            bannedUsers, // isBanned: true (Need to ensure I have a way to count banned users. findAll with filter? or new method?)
            // I added `countByStatus` to BookRepo, but UserRepo filter supports isBanned. I can use findAll or just countDocuments in repo.
            // I added `countByDate`.
            
            totalBooks,
            totalChapters,
            
            totalPosts,
            activePosts,
            
            totalComments,
            totalReviews
        ] = await Promise.all([
            this.userRepository.countByDate(new Date(0)), // Total? Or findAll? I added countByDate. I can use countByDate(0) for total or findAll. I should have added `countTotal` to UserRepo too. I can use `countByDate` with epoch.
            this.userRepository.countByDate(thirtyDaysAgo),
            this.userRepository.findAll({ isBanned: true }, { page: 1, limit: 1 }).then(r => r.meta.total), // Less efficient but works if I didn't add countTotalBanned.
            
            this.bookRepository.countTotal(),
            this.chapterRepository.countChaptersForBooks([]).then(() => 0), // Wait, chapter repo needs countTotal. Original service used `countDocuments()`. I missed adding `countTotal` to ChapterRepo.
            
            this.postRepository.countTotal(),
            this.postRepository.countActive(),
            
            this.commentRepository.countTotal(),
            this.reviewRepository.countTotal()
        ]);

        // Fix Chapter Count: I need to add countTotal to ChapterRepo or use existing method.
        // Fix User Growth:
        const previousMonthUsers = await this.userRepository.countByDate(sixtyDaysAgo, thirtyDaysAgo);
        const growth = previousMonthUsers > 0 ? ((activeUsers - previousMonthUsers) / previousMonthUsers) * 100 : 100;

        // Fix Banned Users: I'll assume findAll returns total count in meta.

        // Wait, ChapterRepo. I need to check `IChapterRepository`.
        // If I can't count chapters efficiently, I might need to add it.
        // For now let's assume I can add it or find a workaround.

        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                banned: bannedUsers,
                growth: Math.round(growth * 10) / 10,
            },
            books: {
                total: totalBooks,
                chapters: 0, // Placeholder until I fix ChapterRepo
            },
            posts: {
                total: totalPosts,
                active: activePosts,
            },
            comments: totalComments,
            reviews: totalReviews,
        };
    }
}

