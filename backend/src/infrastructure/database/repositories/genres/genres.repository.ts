import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Genre as GenreEntity } from '@/domain/genres/entities/genre.entity';
import { GenreFilter, IGenreRepository, PaginationOptions } from '@/domain/genres/repositories/genre.repository.interface';
import { GenreId } from '@/domain/genres/value-objects/genre-id.vo';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';
import { Genre, GenreDocument } from '../../schemas/genre.schema';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { GenreMapper } from './genre.mapper';

interface GenrePersistence {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class GenresRepository implements IGenreRepository {
    constructor(@InjectModel(Genre.name) private readonly genreModel: Model<GenreDocument>) {}

    private toDomain(doc: GenreDocument): GenreEntity {
        return GenreMapper.toDomain(doc);
    }

    private toPersistence(entity: GenreEntity): GenrePersistence {
        return GenreMapper.toPersistence(entity);
    }

    async findById(id: GenreId): Promise<GenreEntity | null> {
        const doc = await this.genreModel.findById(id.toString()).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByName(name: GenreName): Promise<GenreEntity | null> {
        const doc = await this.genreModel.findOne({ name: name.toString() }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findBySlugs(slugs: string[]): Promise<GenreEntity[]> {
        const docs = await this.genreModel.find({ slug: { $in: slugs } }).exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async findAll(
        filter: GenreFilter,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<GenreEntity>> {
        const query: FilterQuery<GenreDocument> = {};
        
        if (filter.name) {
            query.name = { $regex: filter.name, $options: 'i' };
        }

        const skip = (pagination.page - 1) * pagination.limit;
        
        const [docs, total] = await Promise.all([
            this.genreModel.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.genreModel.countDocuments(query).exec()
        ]);

        return {
            data: docs.map(doc => this.toDomain(doc)),
            meta: {
                total,
                current: pagination.page,
                pageSize: pagination.limit,
                totalPages: Math.ceil(total / pagination.limit),
            },
        };
    }

    async findAllSimple(): Promise<GenreEntity[]> {
        const docs = await this.genreModel.find().select('name slug').sort({ name: 1 }).lean().exec();
        return docs.map(doc => GenreEntity.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            slug: doc.slug,
            description: '', 
            createdAt: (doc as any).createdAt || new Date(),
            updatedAt: (doc as any).updatedAt || new Date(),
        }));
    }

    async existsByName(name: GenreName, excludeId?: GenreId): Promise<boolean> {
        const query: FilterQuery<GenreDocument> = { name: name.toString() };
        if (excludeId) {
            query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
        }
        const result = await this.genreModel.exists(query);
        return !!result;
    }

    async countActive(): Promise<number> {
        return this.genreModel.countDocuments({}).exec();
    }

    async save(genre: GenreEntity): Promise<void> {
        const persistenceData = this.toPersistence(genre);
        
        await this.genreModel.findOneAndUpdate(
            { _id: persistenceData._id },
            { $set: persistenceData },
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: GenreId): Promise<void> {
        await this.genreModel.findByIdAndDelete(id.toString()).exec();
    }

    async countByIds(ids: string[]): Promise<number> {
         const objectIds = ids.map(id => new Types.ObjectId(id));
         return this.genreModel.countDocuments({ _id: { $in: objectIds } }).exec();
    }

    async getGenreBookCounts() {
         return this.genreModel.aggregate([
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


