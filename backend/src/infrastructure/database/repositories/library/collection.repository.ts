import { Collection } from '@/domain/library/entities/collection.entity';
import { ICollectionRepository } from '@/domain/library/repositories/collection.repository.interface';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CollectionDocument, Collection as CollectionSchemaClass } from '../../schemas/collection.schema';
import { CollectionMapper } from './collection.mapper';

@Injectable()
export class CollectionRepository implements ICollectionRepository {
    constructor(
        @InjectModel(CollectionSchemaClass.name)
        private readonly collectionModel: Model<CollectionDocument>
    ) { }

    async save(collection: Collection): Promise<void> {
        const persistenceData = CollectionMapper.toPersistence(collection);

        await this.collectionModel.findOneAndUpdate(
            { _id: persistenceData._id },
            { $set: persistenceData },
            { upsert: true, new: true }
        ).exec();
    }

    async findById(id: string): Promise<Collection | null> {
        const doc = await this.collectionModel.findById(new Types.ObjectId(id)).exec();
        return doc ? CollectionMapper.toDomain(doc) : null;
    }

    async findByUserId(userId: string): Promise<Collection[]> {
        const docs = await this.collectionModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ name: 1 })
            .exec();
        return docs.map(doc => CollectionMapper.toDomain(doc));
    }

    async findByUserIdAndName(userId: string, name: string): Promise<Collection | null> {
        const doc = await this.collectionModel.findOne({
            userId: new Types.ObjectId(userId),
            name: name
        }).exec();
        return doc ? CollectionMapper.toDomain(doc) : null;
    }

    async findByIds(ids: string[]): Promise<Collection[]> {
        const objectIds = ids.map(id => new Types.ObjectId(id));
        const docs = await this.collectionModel.find({ _id: { $in: objectIds } }).exec();
        return docs.map(doc => CollectionMapper.toDomain(doc));
    }

    async delete(id: string): Promise<void> {
        await this.collectionModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    }
}
