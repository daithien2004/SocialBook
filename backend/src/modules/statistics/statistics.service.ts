import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas
import { User, UserDocument } from '../users/schemas/user.schema';
import { Book, BookDocument } from '../books/schemas/book.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Progress, ProgressDocument } from '../progress/schemas/progress.schema';
import { Chapter, ChapterDocument } from '../chapters/schemas/chapter.schema';

// DTOs
import {
  OverviewStats,
  UserStats,
  BookStats,
  PostStats,
  GrowthMetric,
  ReadingHeatmapData,
  ChapterEngagementData,
  ReadingSpeedData,
  GeographicData,
  ActiveUsersData,
} from './dto/statistics.dto';
@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
  ) { }

  async getOverview(): Promise<OverviewStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
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
      this.chapterModel.countDocuments(),
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
      this.chapterModel.countDocuments(),
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
        .select('title slug views likes')
        .sort({ views: -1 })
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

  async getGrowthMetrics(
    days: number = 30,
    groupBy: 'day' | 'month' | 'year' = 'day',
  ): Promise<GrowthMetric[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Determine date format based on groupBy parameter
    let dateFormat: string;
    switch (groupBy) {
      case 'month':
        dateFormat = '%Y-%m'; // e.g., "2025-11"
        break;
      case 'year':
        dateFormat = '%Y'; // e.g., "2025"
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d'; // e.g., "2025-11-26"
        break;
    }

    // Reusable aggregation stages with dynamic date formatting
    const commonStages: any[] = [
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
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

  // ============ Advanced Analytics Methods ============

  /**
   * Get reading activity heatmap by hour of day
   */
  async getReadingHeatmap(): Promise<ReadingHeatmapData[]> {
    const result = await this.progressModel.aggregate([
      {
        $project: {
          hour: { $hour: { date: '$lastReadAt', timezone: '+07:00' } },
        },
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill in missing hours with 0 count
    const heatmapData: ReadingHeatmapData[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = result.find((r) => r._id === hour);
      heatmapData.push({
        hour,
        count: data ? data.count : 0,
      });
    }

    return heatmapData;
  }

  /**
   * Get chapter engagement analytics
   */
  async getChapterEngagement(
    limit: number = 10,
  ): Promise<ChapterEngagementData[]> {
    const result = await this.progressModel.aggregate([
      {
        $group: {
          _id: '$chapterId',
          viewCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$status', 'completed'] },
                    { $gte: ['$progress', 60] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalTimeSpent: { $sum: '$timeSpent' },
        },
      },
      {
        $lookup: {
          from: 'chapters',
          localField: '_id',
          foreignField: '_id',
          as: 'chapter',
        },
      },
      { $unwind: '$chapter' },
      {
        $lookup: {
          from: 'books',
          localField: 'chapter.bookId',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      {
        $project: {
          chapterId: { $toString: '$_id' },
          chapterTitle: '$chapter.title',
          bookTitle: '$book.title',
          viewCount: 1,
          completionRate: {
            $cond: [
              { $gt: ['$viewCount', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$viewCount'] }, 100] },
              0,
            ],
          },
          averageTimeSpent: {
            $cond: [
              { $gt: ['$viewCount', 0] },
              { $divide: ['$totalTimeSpent', '$viewCount'] },
              0,
            ],
          },
        },
      },
      { $sort: { viewCount: -1 } },
      { $limit: limit },
    ]);

    return result.map((item) => ({
      chapterId: item.chapterId,
      chapterTitle: item.chapterTitle,
      bookTitle: item.bookTitle,
      viewCount: item.viewCount,
      completionRate: Math.round(item.completionRate * 10) / 10,
      averageTimeSpent: Math.round(item.averageTimeSpent),
    }));
  }

  /**
   * Get reading speed analytics over time
   */
  async getReadingSpeed(days: number = 30): Promise<ReadingSpeedData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.progressModel.aggregate([
      {
        $match: {
          lastReadAt: { $gte: startDate },
          timeSpent: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'chapters',
          localField: 'chapterId',
          foreignField: '_id',
          as: 'chapter',
        },
      },
      { $unwind: '$chapter' },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$lastReadAt' } },
          wordsPerMinute: {
            $cond: [
              { $gt: ['$timeSpent', 0] },
              {
                $divide: [
                  {
                    $size: {
                      $split: [
                        {
                          $reduce: {
                            input: '$chapter.paragraphs',
                            initialValue: '',
                            in: { $concat: ['$$value', ' ', '$$this.content'] },
                          },
                        },
                        ' ',
                      ],
                    },
                  },
                  { $divide: ['$timeSpent', 60] },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$date',
          averageSpeed: { $avg: '$wordsPerMinute' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((item) => ({
      date: item._id,
      averageSpeed: Math.round(item.averageSpeed),
    }));
  }

  /**
   * Get geographic distribution of users
   */
  async getGeographicDistribution(): Promise<GeographicData[]> {
    // Uses 'location' field from User schema (user-entered location)
    const result = await this.userModel.aggregate([
      {
        $group: {
          _id: '$location',
          userCount: { $sum: 1 },
        },
      },
      { $match: { $and: [{ _id: { $ne: null } }, { _id: { $ne: '' } }] } }, // Exclude null and empty strings
      { $sort: { userCount: -1 } },
      { $limit: 20 },
    ]);

    return result.map((item) => ({
      country: item._id || 'Unknown',
      userCount: item.userCount,
    }));
  }

  /**
   * Get real-time active users count
   */
  async getActiveUsers(): Promise<ActiveUsersData> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const count = await this.progressModel.countDocuments({
      lastReadAt: { $gte: fiveMinutesAgo },
    });

    return {
      count,
      timestamp: new Date().toISOString(),
    };
  }
}
