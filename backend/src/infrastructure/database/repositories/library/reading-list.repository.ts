import { ReadingList, ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { ReadingListDocument, ReadingList as ReadingListSchemaClass } from '../../schemas/reading-list.schema';
import { LibraryMapper, PopulatedReadingListDocument, RawReadingListDocument } from './library.mapper';

@Injectable()
export class ReadingListRepository implements IReadingListRepository {
    constructor(
        @InjectModel(ReadingListSchemaClass.name)
        private readonly readingListModel: Model<ReadingListDocument>
    ) { }

    async save(readingList: ReadingList): Promise<void> {
        const persistenceData = LibraryMapper.toPersistence(readingList);

        await this.readingListModel.findOneAndUpdate(
            { _id: persistenceData._id },
            { $set: persistenceData },
            { upsert: true, new: true }
        ).exec();
    }

    async findByUserIdAndBookId(userId: UserId, bookId: BookId): Promise<ReadingList | null> {
        const doc = await this.readingListModel.findOne({
            userId: new Types.ObjectId(userId.toString()),
            bookId: new Types.ObjectId(bookId.toString())
        }).exec();

        return doc ? LibraryMapper.toDomain(doc as unknown as RawReadingListDocument) : null;
    }

    async remove(userId: UserId, bookId: BookId): Promise<void> {
        await this.readingListModel.deleteOne({
            userId: new Types.ObjectId(userId.toString()),
            bookId: new Types.ObjectId(bookId.toString())
        }).exec();
    }

    async exists(userId: UserId, bookId: BookId): Promise<boolean> {
        const result = await this.readingListModel.exists({
            userId: new Types.ObjectId(userId.toString()),
            bookId: new Types.ObjectId(bookId.toString())
        });

        return !!result;
    }

    async countByUser(userId: string): Promise<number> {
        return this.readingListModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec();
    }

    async countByCollectionId(collectionId: string): Promise<number> {
        return this.readingListModel.countDocuments({ collectionIds: new Types.ObjectId(collectionId) }).exec();
    }

    async findByCollectionId(collectionId: string): Promise<LibraryItemReadModel[]> {
        const docs = await this.readingListModel
            .find({ collectionIds: new Types.ObjectId(collectionId) })
            .populate('bookId')
            .populate('lastReadChapterId')
            .sort({ updatedAt: -1 })
            .lean()
            .exec();

        return docs.map(doc => LibraryMapper.toReadModel(doc as unknown as PopulatedReadingListDocument));
    }

    async findDetailByUserIdAndBookId(userId: UserId, bookId: BookId): Promise<LibraryItemReadModel | null> {
        const doc = await this.readingListModel.findOne({
            userId: new Types.ObjectId(userId.toString()),
            bookId: new Types.ObjectId(bookId.toString())
        })
            .populate('bookId')
            .populate('lastReadChapterId')
            .lean()
            .exec();

        return doc ? LibraryMapper.toReadModel(doc as unknown as PopulatedReadingListDocument) : null;
    }

    async findAllDetailByUserId(userId: UserId, status?: ReadingStatus): Promise<LibraryItemReadModel[]> {
        const query: FilterQuery<ReadingListDocument> = {
            userId: new Types.ObjectId(userId.toString())
        };

        if (status) {
            query.status = status;
        }

        const docs = await this.readingListModel
            .find(query)
            .populate('bookId')
            .populate('lastReadChapterId')
            .sort({ updatedAt: -1 })
            .lean()
            .exec();

        return docs.map(doc => LibraryMapper.toReadModel(doc as unknown as PopulatedReadingListDocument));
    }
}

