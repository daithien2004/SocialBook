import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Book, BookDocument } from '../books/schemas/book.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
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
            this.userModel.countDocuments().exec(),
            this.userModel
                .countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
                .exec(),
            this.userModel.countDocuments({ isBanned: true }).exec(),
            this.userModel
                .countDocuments({
                    createdAt: {
                        $lt: thirtyDaysAgo,
                        $gte: new Date(
                            thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000,
                        ),
                    },
                })
                .exec(),
            this.bookModel.countDocuments().exec(),
            this.bookModel
                .aggregate([
                    {
                        $group: {
                            _id: null,
                            totalChapters: { $sum: { $size: { $ifNull: ['$chapters', []] } } },
                        },
                    },
                ])
                .exec()
                .then((result) => result[0]?.totalChapters || 0),
            this.postModel.countDocuments().exec(),
            this.postModel.countDocuments({ deletedAt: null }).exec(),
            this.commentModel.countDocuments().exec(),
            this.reviewModel.countDocuments().exec(),
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
        const [total, verified, banned, byProvider, recentData] = await Promise.all(
            [
                this.userModel.countDocuments().exec(),
                this.userModel.countDocuments({ isVerified: true }).exec(),
                this.userModel.countDocuments({ isBanned: true }).exec(),
                this.userModel
                    .aggregate([
                        {
                            $group: {
                                _id: '$provider',
                                count: { $sum: 1 },
                            },
                        },
                    ])
                    .exec(),
                this.userModel
                    .aggregate([
                        {
                            $match: {
                                createdAt: {
                                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                },
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                                },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
                        { $limit: 30 },
                    ])
                    .exec(),
            ],
        );

        const providerMap = byProvider.reduce(
            (acc, item) => {
                acc[item._id] = item.count;
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
            this.bookModel.countDocuments().exec(),
            this.bookModel
                .aggregate([
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $size: { $ifNull: ['$chapters', []] } } },
                        },
                    },
                ])
                .exec()
                .then((result) => result[0]?.total || 0),
            this.bookModel
                .aggregate([
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
                ])
                .exec(),
            this.bookModel
                .find()
                .select('_id title slug viewCount likeCount')
                .sort({ viewCount: -1 })
                .limit(10)
                .lean()
                .exec(),
        ]);

        return {
            total,
            totalChapters,
            byGenre: byGenre.map((item) => ({
                genres: item._id,
                count: item.count,
            })),
            popularBooks: popularBooks.map((book: any) => ({
                id: book._id.toString(),
                title: book.title,
                slug: book.slug,
                views: book.viewCount || 0,
                likes: book.likeCount || 0,
            })),
        };
    }

    async getPostStats(): Promise<PostStats> {
        const [total, active, deleted, totalComments] = await Promise.all([
            this.postModel.countDocuments().exec(),
            this.postModel.countDocuments({ deletedAt: null }).exec(),
            this.postModel.countDocuments({ deletedAt: { $ne: null } }).exec(),
            this.commentModel.countDocuments().exec(),
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
    ): Promise<GrowthMetric[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [userGrowth, bookGrowth, postGrowth] = await Promise.all([
            this.userModel
                .aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ])
                .exec(),
            this.bookModel
                .aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ])
                .exec(),
            this.postModel
                .aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ])
                .exec(),
        ]);

        // Merge all growth data by date
        const dateMap = new Map<string, GrowthMetric>();

        userGrowth.forEach((item) => {
            dateMap.set(item._id, {
                date: item._id,
                users: item.count,
                books: 0,
                posts: 0,
            });
        });

        bookGrowth.forEach((item) => {
            const existing = dateMap.get(item._id) || {
                date: item._id,
                users: 0,
                books: 0,
                posts: 0,
            };
            existing.books = item.count;
            dateMap.set(item._id, existing);
        });

        postGrowth.forEach((item) => {
            const existing = dateMap.get(item._id) || {
                date: item._id,
                users: 0,
                books: 0,
                posts: 0,
            };
            existing.posts = item.count;
            dateMap.set(item._id, existing);
        });

        return Array.from(dateMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date),
        );
    }
}
