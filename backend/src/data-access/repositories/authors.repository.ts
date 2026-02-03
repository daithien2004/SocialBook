import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Author, AuthorDocument } from '../../modules/authors/schemas/author.schema';
import { GenericRepository } from '../../shared/repository/generic.repository';

@Injectable()
export class AuthorsRepository extends GenericRepository<AuthorDocument> {
    constructor(@InjectModel(Author.name) authorModel: Model<AuthorDocument>) {
        super(authorModel);
    }

    async findAllForAdmin(query: any, current: number, pageSize: number) {
        const filter: FilterQuery<AuthorDocument> = {};
        if (query.name) {
            filter.name = { $regex: query.name, $options: 'i' };
        }

        return this.findMany({
            filter,
            page: current,
            limit: pageSize,
            sort: { createdAt: -1 },
        });
    }

    async findAllForSelect(): Promise<AuthorDocument[]> {
        return this.model
            .find()
            .select('name bio')
            .sort({ name: 1 })
            .lean()
            .exec();
    }

    async findByName(name: string, excludeId?: string): Promise<AuthorDocument | null> {
        const query: FilterQuery<AuthorDocument> = { name };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        return this.model.findOne(query).lean().exec();
    }
}
