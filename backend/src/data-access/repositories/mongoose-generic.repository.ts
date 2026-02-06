import { NotFoundException } from '@nestjs/common';
import { Document, Model } from 'mongoose';
import { IGenericRepository } from '../../domain/repositories/generic.repository.interface';

export class MongooseGenericRepository<TDoc extends Document, TEntity> implements IGenericRepository<TEntity> {
    constructor(
        protected readonly model: Model<TDoc>,
        private readonly mapper: (doc: TDoc) => TEntity
    ) { }

    async findMany(options: any): Promise<any> {
        const {
            filter = {},
            page = 1,
            limit = 10,
            sort = { createdAt: -1 },
            populate,
        } = options;

        const skip = (page - 1) * limit;

        let query = this.model
            .find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort);

        if (populate) query = query.populate(populate);

        const [docs, total] = await Promise.all([
            query.exec(),
            this.model.countDocuments(filter),
        ]);

        return {
            data: docs.map(this.mapper),
            meta: {
                current: Number(page),
                pageSize: Number(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: string | any, populate?: string | string[]): Promise<TEntity | null> {
        let query = this.model.findById(id);
        if (populate) query = query.populate(populate);
        const doc = await query.exec();
        return doc ? this.mapper(doc as TDoc) : null;
    }

    async findOne(filter: any, populate?: string | string[]): Promise<TEntity | null> {
        let query = this.model.findOne(filter);
        if (populate) query = query.populate(populate);
        const doc = await query.exec();
        return doc ? this.mapper(doc as TDoc) : null;
    }

    async create(data: any): Promise<TEntity> {
        const createdDoc = await this.model.create(data);
        return this.mapper(createdDoc);
    }

    async update(id: string | any, data: any): Promise<TEntity> {
        const updatedDoc = await this.model.findByIdAndUpdate(id, data, { new: true });
        if (!updatedDoc) throw new NotFoundException('Not found');
        return this.mapper(updatedDoc);
    }

    async delete(id: string | any): Promise<void> {
        const result = await this.model.findByIdAndDelete(id);
        if (!result) throw new NotFoundException('Not found');
    }

    async count(filter: any = {}): Promise<number> {
        return this.model.countDocuments(filter);
    }
}
