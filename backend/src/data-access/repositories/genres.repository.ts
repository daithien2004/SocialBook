import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Genre as GenreEntity } from '../../domain/entities/genre.entity';
import { IGenreRepository } from '../../domain/repositories/genre.repository.interface';
import { Genre, GenreDocument } from '../../modules/genres/schemas/genre.schema';
import { MongooseGenericRepository } from './mongoose-generic.repository';

@Injectable()
export class GenresRepository
    extends MongooseGenericRepository<GenreDocument, GenreEntity>
    implements IGenreRepository {
    constructor(@InjectModel(Genre.name) genreModel: Model<GenreDocument>) {
        super(genreModel, (doc) => new GenreEntity({
            id: doc._id.toString(),
            name: doc.name,
            slug: doc.slug,
            description: doc.description,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        }));
    }


    async existsByName(name: string, excludeId?: string): Promise<boolean> {
        const query: FilterQuery<GenreDocument> = { name };
        if (excludeId) {
            query._id = { $ne: new Types.ObjectId(excludeId) };
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

    async findAllSimple(): Promise<GenreEntity[]> {
        const docs = await this.model
            .find()
            .select('name slug')
            .sort({ name: 1 })
            .lean()
            .exec();

        return docs.map(doc => new GenreEntity({
            id: doc._id.toString(),
            name: doc.name
        }));
    }

    // Giữ lại các phương thức đặc thù nếu cần, nhưng map kết quả về Entity/ID thuần túy
    async findBySlugs(slugs: string[]): Promise<string[]> {
        const docs = await this.model.find({
            slug: { $in: slugs }
        }).select('_id').lean().exec();
        return docs.map(doc => doc._id.toString());
    }

    async countByIds(ids: string[]): Promise<number> {
        const objectIds = ids.map(id => new Types.ObjectId(id));
        return this.model.countDocuments({ _id: { $in: objectIds } }).exec();
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

