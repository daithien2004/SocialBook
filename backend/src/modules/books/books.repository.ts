import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types, UpdateQuery } from 'mongoose';
import { GenericRepository } from '../../shared/repository/generic.repository';
import { Book, BookDocument } from './schemas/book.schema';

@Injectable()
export class BooksRepository extends GenericRepository<BookDocument> {
    constructor(@InjectModel(Book.name) bookModel: Model<BookDocument>) {
        super(bookModel);
    }

    async existsBySlug(slug: string, excludeId?: string | Types.ObjectId): Promise<boolean> {
        const query: FilterQuery<BookDocument> = { slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const result = await this.model.exists(query);
        return !!result;
    }

    async existsById(id: string | Types.ObjectId): Promise<boolean> {
        const result = await this.model.exists({ _id: id });
        return !!result;
    }

    async incrementViews(id: string | Types.ObjectId) {
        return this.model.updateOne({ _id: id }, { $inc: { views: 1 } }).exec();
    }

    async countByGenre(genreId: string | Types.ObjectId): Promise<number> {
        return this.model.countDocuments({ genres: genreId }).exec();
    }

    async getTagStats() {
        return this.model.aggregate([
            { $match: { isDeleted: false, status: { $in: ['published', 'completed'] } } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $project: { _id: 0, name: '$_id', count: 1 } },
        ]);
    }

    async findAllAggregated(pipeline: PipelineStage[]) {
        return this.model.aggregate(pipeline);
    }

    async findBySlugWithPopulate(slug: string) {
        return this.model
            .findOne({ slug, isDeleted: false })
            .populate('authorId', 'name avatar')
            .populate('genres', 'name')
            .lean()
            .exec();
    }

    async findByIdWithPopulate(id: string | Types.ObjectId) {
        return this.model
            .findOne({ _id: id, isDeleted: false })
            .populate('authorId', 'name avatar')
            .populate('genres', 'name')
            .lean()
            .exec();
    }

    async updateAndPopulate(id: string | Types.ObjectId, updateData: UpdateQuery<BookDocument>) {
        return this.model
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('authorId', 'name avatar')
            .populate('genres', 'name')
            .exec();
    }

    async findBySlugSelect(slug: string, select: string | string[]) {
        return this.model
            .findOne({ slug, isDeleted: false })
            .select(select)
            .lean()
            .exec();
    }

    async toggleLike(bookId: string | Types.ObjectId, userId: string | Types.ObjectId, isLiked: boolean) {
        const update = isLiked
            ? { $pull: { likedBy: userId }, $inc: { likes: -1 } }
            : { $addToSet: { likedBy: userId }, $inc: { likes: 1 } };

        return this.model
            .findByIdAndUpdate(bookId, update, { new: true })
            .select('slug likes likedBy')
            .exec();
    }

    async findWithAdvancedFilters(
        filter: {
            status?: string;
            search?: string;
            genreIds?: Types.ObjectId[];
            authorId?: Types.ObjectId;
            tags?: string[];
        },
        options: {
            skip: number;
            limit: number;
            sort: Record<string, 1 | -1>;
            sortBy?: string;
        }
    ) {
        const { status, search, genreIds, authorId, tags } = filter;
        const { skip, limit, sort, sortBy } = options;

        const matchStage: FilterQuery<BookDocument> = { isDeleted: false };

        if (status) matchStage.status = status;
        if (genreIds && genreIds.length > 0) matchStage.genres = { $in: genreIds };
        if (authorId) matchStage.authorId = authorId;
        if (tags && tags.length > 0) matchStage.tags = { $in: tags };

        const pipeline: PipelineStage[] = [];

        if (search) {
            pipeline.push(
                {
                    $lookup: {
                        from: 'authors',
                        localField: 'authorId',
                        foreignField: '_id',
                        as: 'authorData',
                    },
                },
                {
                    $addFields: {
                        authorName: { $arrayElemAt: ['$authorData.name', 0] }
                    }
                },
                {
                    $match: {
                        ...matchStage,
                        $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { slug: { $regex: search, $options: 'i' } },
                            { authorName: { $regex: search, $options: 'i' } },
                        ]
                    }
                }
            );
        } else {
            pipeline.push({ $match: matchStage });
        }

        if (sortBy === 'rating' || sortBy === 'popular') {
            pipeline.push(
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'bookId',
                        as: 'reviewsData',
                    },
                },
                {
                    $addFields: {
                        computedRating: { $avg: '$reviewsData.rating' },
                        reviewsCount: { $size: '$reviewsData' },
                    },
                }
            );
        }

        pipeline.push({ $sort: sort });

        pipeline.push({
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },

                    ...(search ? [] : [
                        {
                            $lookup: {
                                from: 'authors',
                                localField: 'authorId',
                                foreignField: '_id',
                                as: 'authorId',
                            },
                        },
                        {
                            $unwind: {
                                path: '$authorId',
                                preserveNullAndEmptyArrays: true
                            },
                        },
                    ]),

                    ...(search ? [
                        {
                            $addFields: {
                                authorId: { $arrayElemAt: ['$authorData', 0] }
                            }
                        }
                    ] : []),

                    {
                        $lookup: {
                            from: 'genres',
                            localField: 'genres',
                            foreignField: '_id',
                            as: 'genres',
                        },
                    },

                    {
                        $lookup: {
                            from: 'chapters',
                            localField: '_id',
                            foreignField: 'bookId',
                            as: 'chaptersData',
                        },
                    },

                    ...(sortBy !== 'rating' && sortBy !== 'popular'
                        ? [
                            {
                                $lookup: {
                                    from: 'reviews',
                                    localField: '_id',
                                    foreignField: 'bookId',
                                    as: 'reviewsData',
                                },
                            },
                        ]
                        : []),

                    {
                        $addFields: {
                            stats: {
                                chapters: { $size: '$chaptersData' },
                                views: { $ifNull: ['$views', 0] },
                                likes: { $ifNull: ['$likes', 0] },
                                rating: {
                                    $ifNull: [
                                        {
                                            $cond: {
                                                if: { $gt: [{ $size: '$reviewsData' }, 0] },
                                                then: { $avg: '$reviewsData.rating' },
                                                else: 0
                                            }
                                        },
                                        0
                                    ]
                                },
                                reviews: { $size: '$reviewsData' },
                            },
                        },
                    },
                    {
                        $project: {
                            reviewsData: 0,
                            chaptersData: 0,
                            computedRating: 0,
                            reviewsCount: 0,
                            password: 0,
                            authorData: 0,
                            authorName: 0,
                        }
                    },
                ],

                totalCount: [{ $count: 'count' }],
            },
        });

        const [result] = await this.model.aggregate(pipeline);
        return {
            data: result.data,
            total: result.totalCount[0]?.count || 0,
        };
    }
}
