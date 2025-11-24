import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas
import { User, UserDocument } from '../users/schemas/user.schema';
import { Book, BookDocument } from '../books/schemas/book.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';

// DTOs
import {
  OverviewStats,
  UserStats,
  BookStats,
  PostStats,
  GrowthMetric,
} from './dto/statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async getOverview(): Promise<OverviewStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers, // Note: Logic cũ đang đếm New Users trong 30 ngày
      bannedUsers,
      previousMonthUsers,
      totalBooks,
      totalChapters,
      totalPosts,
      activePosts,
      totalComments,
      totalReviews,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      this.userModel.countDocuments({ isBanned: true }),
      this.userModel.countDocuments({
        createdAt: {
          $lt: thirtyDaysAgo,
          $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      this.bookModel.countDocuments(),
      this.bookModel
        .aggregate([
          {
            $group: {
              _id: null,
              totalChapters: {
                $sum: { $size: { $ifNull: ['$chapters', []] } },
              },
            },
          },
        ])
        .then((res) => res[0]?.totalChapters || 0),
      this.postModel.countDocuments(),
      this.postModel.countDocuments({ deletedAt: null }),
      this.commentModel.countDocuments(),
      this.reviewModel.countDocuments(),
    ]);

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

  async getUserStats(): Promise<UserStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, verified, banned, byProvider, recentData] = await Promise.all(
      [
        this.userModel.countDocuments(),
        this.userModel.countDocuments({ isVerified: true }),
        this.userModel.countDocuments({ isBanned: true }),
        this.userModel.aggregate([
          { $group: { _id: '$provider', count: { $sum: 1 } } },
        ]),
        this.userModel.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ],
    );

    const providerMap = byProvider.reduce(
      (acc, item) => {
        acc[item._id || 'local'] = item.count;
        return acc;
      },
      { local: 0, google: 0, facebook: 0 },
    );

    return {
      total,
      verified,
      banned,
      byProvider: providerMap,
      recentRegistrations: recentData.map((item) => ({
        date: item._id,
        count: item.count,
      })),
    };
  }

  async getBookStats(): Promise<BookStats> {
    const [total, totalChapters, byGenre, popularBooks] = await Promise.all([
      this.bookModel.countDocuments(),
      this.bookModel
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: { $size: { $ifNull: ['$chapters', []] } } },
            },
          },
        ])
        .then((result) => result[0]?.total || 0),
      this.bookModel.aggregate([
        { $unwind: '$genres' },
        {
          $lookup: {
            from: 'genres',
            localField: 'genres',
            foreignField: '_id',
            as: 'genreInfo',
          },
        },
        { $unwind: '$genreInfo' },
        {
          $group: {
            _id: '$genreInfo.name',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      this.bookModel
        .find()
        .select('title slug viewCount likeCount')
        .sort({ viewCount: -1 })
        .limit(10)
        .lean(),
    ]);

    return {
      total,
      totalChapters,
      byGenre: byGenre.map((item) => ({
        genres: item._id,
        count: item.count,
      })),
      popularBooks: popularBooks.map((book) => ({
        ...book, // Interceptor sẽ tự động map _id -> id
        views: book.views || 0,
        likes: book.likes || 0,
      })) as any,
    };
  }

  async getPostStats(): Promise<PostStats> {
    const [total, active, deleted, totalComments] = await Promise.all([
      this.postModel.countDocuments(),
      this.postModel.countDocuments({ deletedAt: null }),
      this.postModel.countDocuments({ deletedAt: { $ne: null } }),
      this.commentModel.countDocuments(),
    ]);

    return {
      total,
      active,
      deleted,
      totalComments,
    };
  }

  async getGrowthMetrics(days: number = 30): Promise<GrowthMetric[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Reusable aggregation stages
    const commonStages: any[] = [
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const [userGrowth, bookGrowth, postGrowth] = await Promise.all([
      this.userModel.aggregate(commonStages),
      this.bookModel.aggregate(commonStages),
      this.postModel.aggregate(commonStages),
    ]);

    const dateMap = new Map<string, GrowthMetric>();

    const mergeData = (data: any[], key: keyof GrowthMetric) => {
      data.forEach((item) => {
        const existing = dateMap.get(item._id) || {
          date: item._id,
          users: 0,
          books: 0,
          posts: 0,
        };
        (existing as any)[key] = item.count;
        dateMap.set(item._id, existing);
      });
    };

    mergeData(userGrowth, 'users');
    mergeData(bookGrowth, 'books');
    mergeData(postGrowth, 'posts');

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }
}
