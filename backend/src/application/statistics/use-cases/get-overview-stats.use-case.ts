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
