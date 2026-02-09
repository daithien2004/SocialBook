import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { ReadingList, ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { PaginatedResult } from '../../../../common/interfaces/pagination.interface';
import { ReadingListDocument } from '../../schemas/reading-list.schema';
import { ReadingList as ReadingListSchemaClass } from '../../schemas/reading-list.schema';

interface ReadingListPersistence {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    bookId: Types.ObjectId;
    status: ReadingStatus;
    lastReadChapterId: Types.ObjectId | null;
    collectionIds: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class ReadingListRepository implements IReadingListRepository {
    constructor(
        @InjectModel(ReadingListSchemaClass.name)
        private readonly readingListModel: Model<ReadingListDocument>
    ) {}

    private toDomain(doc: ReadingListDocument): ReadingList {
        return ReadingList.reconstitute({
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bookId: doc.bookId.toString(),
            status: doc.status,
            lastReadChapterId: doc.lastReadChapterId?.toString() || null,
            collectionIds: doc.collectionIds.map(id => id.toString()),
            createdAt: doc.createdAt as Date,
            updatedAt: doc.updatedAt as Date
        });
    }

    private toPersistence(readingList: ReadingList): ReadingListPersistence {
        return {
            _id: new Types.ObjectId(readingList.id.toString()),
            userId: new Types.ObjectId(readingList.userId.toString()),
            bookId: new Types.ObjectId(readingList.bookId.toString()),
            status: readingList.status,
            lastReadChapterId: readingList.lastReadChapterId
                ? new Types.ObjectId(readingList.lastReadChapterId.toString())
                : null,
            collectionIds: readingList.collectionIds.map(id => new Types.ObjectId(id)),
            createdAt: readingList.createdAt,
            updatedAt: readingList.updatedAt
        };
    }

    async save(readingList: ReadingList): Promise<void> {
        const persistenceData = this.toPersistence(readingList);

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

        return doc ? this.toDomain(doc) : null;
    }

    async findByUserId(userId: UserId, status?: ReadingStatus): Promise<ReadingList[]> {
        const query: FilterQuery<ReadingListDocument> = {
            userId: new Types.ObjectId(userId.toString())
        };

        if (status) {
            query.status = status;
        }

        const docs = await this.readingListModel
            .find(query)
            .sort({ updatedAt: -1 })
            .exec();

        return docs.map(doc => this.toDomain(doc));
    }

    async findByUserIdWithPagination(
        userId: UserId,
        status: ReadingStatus,
        pagination: { page: number; limit: number }
    ): Promise<PaginatedResult<ReadingList>> {
        const query: FilterQuery<ReadingListDocument> = {
            userId: new Types.ObjectId(userId.toString()),
            status
        };

        const skip = (pagination.page - 1) * pagination.limit;

        const [docs, total] = await Promise.all([
            this.readingListModel
                .find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.readingListModel.countDocuments(query).exec()
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
}

