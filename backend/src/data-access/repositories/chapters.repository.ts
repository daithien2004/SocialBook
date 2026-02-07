import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../../modules/chapters/infrastructure/schemas/chapter.schema';
import { GenericRepository } from '../../shared/repository/generic.repository';

@Injectable()
export class ChaptersRepository extends GenericRepository<ChapterDocument> {
    constructor(@InjectModel(Chapter.name) chapterModel: Model<ChapterDocument>) {
        super(chapterModel);
    }

    async findChaptersWithInfo(bookId: string | Types.ObjectId, options?: { skip?: number; limit?: number }) {
        const pipeline: PipelineStage[] = [
            { $match: { bookId } },
            { $sort: { orderIndex: 1 } },
        ];

        if (options?.skip !== undefined) {
            pipeline.push({ $skip: options.skip });
        }

        if (options?.limit !== undefined) {
            pipeline.push({ $limit: Number(options.limit) });
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'texttospeeches',
                    localField: '_id',
                    foreignField: 'chapterId',
                    as: 'ttsData',
                },
            },
            {
                $addFields: {
                    latestTTS: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$ttsData',
                                    as: 'tts',
                                    cond: { $ne: ['$$tts.status', 'failed'] },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    orderIndex: 1,
                    viewsCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    paragraphsCount: { $size: { $ifNull: ['$paragraphs', []] } },
                    ttsStatus: { $ifNull: ['$latestTTS.status', null] },
                    audioUrl: { $ifNull: ['$latestTTS.audioUrl', null] },
                },
            },
        );

        return this.model.aggregate(pipeline);
    }

    async findLastChapter(bookId: string | Types.ObjectId) {
        return this.model
            .findOne({ bookId })
            .sort({ orderIndex: -1 })
            .select('orderIndex')
            .lean()
            .exec();
    }

    async existsBySlug(bookId: string | Types.ObjectId, slug: string, excludeId?: string | Types.ObjectId): Promise<boolean> {
        const query: FilterQuery<ChapterDocument> = { bookId, slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const result = await this.model.exists(query);
        return !!result;
    }

    async incrementViews(id: string | Types.ObjectId) {
        return this.model.updateOne({ _id: id }, { $inc: { viewsCount: 1 } }).exec();
    }

    async findPreviousChapter(bookId: string | Types.ObjectId, currentOrderIndex: number) {
        return this.model
            .findOne({ bookId, orderIndex: { $lt: currentOrderIndex } })
            .select('title slug orderIndex')
            .sort({ orderIndex: -1 })
            .lean()
            .exec();
    }

    async findNextChapter(bookId: string | Types.ObjectId, currentOrderIndex: number) {
        return this.model
            .findOne({ bookId, orderIndex: { $gt: currentOrderIndex } })
            .select('title slug orderIndex')
            .sort({ orderIndex: 1 })
            .lean()
            .exec();
    }

    async findBySlug(bookId: string | Types.ObjectId, slug: string) {
        return this.model.findOne({ bookId, slug }).lean().exec();
    }

    async countByBookId(bookId: string | Types.ObjectId): Promise<number> {
        return this.model.countDocuments({ bookId }).exec();
    }
}
