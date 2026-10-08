import { GetOverviewStatsQuery } from './get-overview-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { IPostRepository } from '@/modules/posts/domain/public-api';
import { ICommentRepository } from '@/modules/comments/domain/public-api';
import { IReviewRepository } from '@/modules/reviews/domain/public-api';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { OverviewStats } from '@/modules/statistics/domain/read-models/statistics.model';

@QueryHandler(GetOverviewStatsQuery)
export class GetOverviewStatsHandler {
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
    const sixtyDaysAgo = new Date(
      thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    const [
      totalUsers,
      activeUsers,
      bannedUsers,

      totalBooks,
      totalChapters,

      totalPosts,
      activePosts,

      totalComments,
      totalReviews,
    ] = await Promise.all([
      this.userRepository.countByDate(new Date(0)),
      this.userRepository.countByDate(thirtyDaysAgo),
      this.userRepository
        .findAll({ isBanned: true }, { page: 1, limit: 1 })
        .then((r) => r.meta.total),

      this.bookRepository.countTotal(),
      this.chapterRepository.countTotal(),

      this.postRepository.countTotal(),
      this.postRepository.countActive(),

      this.commentRepository.countTotal(),
      this.reviewRepository.countTotal(),
    ]);

    const previousMonthUsers = await this.userRepository.countByDate(
      sixtyDaysAgo,
      thirtyDaysAgo,
    );
    const growth =
      previousMonthUsers > 0
        ? ((activeUsers - previousMonthUsers) / previousMonthUsers) * 100
        : 100;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        growth: Math.round(growth * 10) / 10,
      },
      books: {
        total: totalBooks,
        chapters: totalChapters,
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
