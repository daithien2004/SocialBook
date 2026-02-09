import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { ReadingProgress, ChapterStatus } from '@/domain/library/entities/reading-progress.entity';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { Progress, ProgressDocument, ProgressSchema } from '../../schemas/progress.schema';
import { ReadingStatus } from '../../schemas/reading-list.schema';

interface ReadingProgressPersistence {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    bookId: Types.ObjectId;
    chapterId: Types.ObjectId;
    progress: number;
    status: string;
    timeSpent: number;
    lastReadAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class ReadingProgressRepository implements IReadingProgressRepository {
    constructor(
        @InjectModel(Progress.name)
        private readonly progressModel: Model<ProgressDocument>
    ) {}

    private toDomain(doc: ProgressDocument): ReadingProgress {
        const status = this.mapStatusToChapterStatus(doc.status);

        return ReadingProgress.reconstitute({
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bookId: doc.bookId.toString(),
            chapterId: doc.chapterId.toString(),
            progress: doc.progress,
            status,
            timeSpent: doc.timeSpent,
            lastReadAt: doc.lastReadAt,
            createdAt: doc.createdAt as Date,
            updatedAt: doc.updatedAt as Date
        });
    }

    private toPersistence(readingProgress: ReadingProgress): ReadingProgressPersistence {
        return {
            _id: new Types.ObjectId(readingProgress.id.toString()),
            userId: new Types.ObjectId(readingProgress.userId.toString()),
            bookId: new Types.ObjectId(readingProgress.bookId.toString()),
            chapterId: new Types.ObjectId(readingProgress.chapterId.toString()),
            progress: readingProgress.progress,
            status: this.mapChapterStatusToStatus(readingProgress.status),
            timeSpent: readingProgress.timeSpent,
            lastReadAt: readingProgress.lastReadAt || new Date(),
            createdAt: readingProgress.createdAt,
            updatedAt: readingProgress.updatedAt
        };
    }

    private mapStatusToChapterStatus(status: string): ChapterStatus {
        switch (status) {
            case ReadingStatus.COMPLETED:
                return ChapterStatus.COMPLETED;
            case ReadingStatus.READING:
                return ChapterStatus.IN_PROGRESS;
            default:
                return ChapterStatus.NOT_STARTED;
        }
    }

    private mapChapterStatusToStatus(status: ChapterStatus): string {
        switch (status) {
            case ChapterStatus.COMPLETED:
                return ReadingStatus.COMPLETED;
            case ChapterStatus.IN_PROGRESS:
                return ReadingStatus.READING;
            default:
                return ReadingStatus.READING; // Default to READING for NOT_STARTED
        }
    }

    async save(readingProgress: ReadingProgress): Promise<void> {
        const persistenceData = this.toPersistence(readingProgress);

        await this.progressModel.findOneAndUpdate(
            { _id: persistenceData._id },
            { $set: persistenceData },
            { upsert: true, new: true }
        ).exec();
    }

    async findByUserIdAndChapterId(userId: UserId, chapterId: ChapterId): Promise<ReadingProgress | null> {
        const doc = await this.progressModel.findOne({
            userId: new Types.ObjectId(userId.toString()),
            chapterId: new Types.ObjectId(chapterId.toString())
        }).exec();

        return doc ? this.toDomain(doc) : null;
    }

    async findByUserIdAndBookId(userId: UserId, bookId: BookId): Promise<ReadingProgress[]> {
        const docs = await this.progressModel.find({
            userId: new Types.ObjectId(userId.toString()),
            bookId: new Types.ObjectId(bookId.toString())
        }).exec();

        return docs.map(doc => this.toDomain(doc));
    }

    async findByUserId(userId: UserId): Promise<ReadingProgress[]> {
        const docs = await this.progressModel.find({
            userId: new Types.ObjectId(userId.toString())
        }).exec();

        return docs.map(doc => this.toDomain(doc));
    }

    async remove(userId: UserId, chapterId: ChapterId): Promise<void> {
        await this.progressModel.deleteOne({
            userId: new Types.ObjectId(userId.toString()),
            chapterId: new Types.ObjectId(chapterId.toString())
        }).exec();
    }

    async exists(userId: UserId, chapterId: ChapterId): Promise<boolean> {
        const result = await this.progressModel.exists({
            userId: new Types.ObjectId(userId.toString()),
            chapterId: new Types.ObjectId(chapterId.toString())
        });

        return !!result;
    }
}

