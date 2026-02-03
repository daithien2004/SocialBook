import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Genre, GenreDocument } from '../../modules/genres/schemas/genre.schema';
import { GenericRepository } from '../../shared/repository/generic.repository';

@Injectable()
export class GenresRepository extends GenericRepository<GenreDocument> {
    constructor(@InjectModel(Genre.name) genreModel: Model<GenreDocument>) {
        super(genreModel);
    }

    async existsByName(name: string, excludeId?: string | Types.ObjectId): Promise<boolean> {
        const query: FilterQuery<GenreDocument> = { name };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const result = await this.model.exists(query);
        return !!result;
    }

    async findAll(query: any, current: number, pageSize: number) {
        const filter: FilterQuery<GenreDocument> = {};
        if (query.name) {
            filter.name = { $regex: query.name, $options: 'i' };
        }

        return this.findMany({
            filter,
            page: current,
            limit: pageSize,
            sort: { name: 1 },
        });
    }

    async findAllSimple(): Promise<GenreDocument[]> {
        return this.model
            .find()
            .select('name slug')
            .sort({ name: 1 })
            .lean()
            .exec() as unknown as GenreDocument[];
    }

    async findBySlugs(slugs: string[]): Promise<{ _id: Types.ObjectId }[]> {
        return this.model.find({
            slug: { $in: slugs }
        }).select('_id').lean().exec() as unknown as { _id: Types.ObjectId }[];
    }

    async countByIds(ids: Types.ObjectId[]): Promise<number> {
        return this.model.countDocuments({ _id: { $in: ids } }).exec();
    }

    async getGenreBookCounts() {
        return this.model.aggregate([
            {
                $lookup: {
                    from: 'books',
                    let: { genreId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ['$$genreId', '$genres'] },
                                        { $eq: ['$isDeleted', false] },
                                        { $in: ['$status', ['published', 'completed']] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'books'
                }
            },
            {
                $addFields: {
                    count: { $size: '$books' }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    count: 1
                }
            },
            { $sort: { name: 1 } }
        ]).exec();
    }
}
