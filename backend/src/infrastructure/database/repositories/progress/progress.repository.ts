import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from '@/infrastructure/database/schemas/progress.schema';
import { IProgressRepository } from '@/domain/progress/repositories/progress.repository.interface';
import { 
    ReadingHeatmapData, 
    ChapterEngagementData, 
    ReadingSpeedData 
} from '@/domain/statistics/models/statistics.model';

@Injectable()
export class ProgressRepository implements IProgressRepository {
    constructor(
        @InjectModel(Progress.name) private readonly progressModel: Model<ProgressDocument>
    ) {}

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

    async getChapterEngagement(limit: number = 10): Promise<ChapterEngagementData[]> {
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

    async countActiveUsers(since: Date): Promise<number> {
        return await this.progressModel.countDocuments({
            lastReadAt: { $gte: since },
        });
    }
}

