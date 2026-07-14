import {
  ChapterStatus,
  ReadingProgress,
} from '@/domain/library/entities/reading-progress.entity';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Progress, ProgressDocument } from '../../schemas/progress.schema';
import { ReadingProgressPersistence } from './reading-progress.mapper';

@Injectable()
export class ReadingProgressRepository implements IReadingProgressRepository {
  constructor(
    @InjectModel(Progress.name)
    private readonly progressModel: Model<ProgressDocument>,
  ) {}

  private toDomain(doc: ProgressDocument): ReadingProgress {
    const status = ReadingProgressRepository.toChapterStatus(doc.status);

    return ReadingProgress.reconstitute({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      bookId: doc.bookId.toString(),
      chapterId: doc.chapterId.toString(),
      progress: doc.progress,
      status,
      timeSpent: doc.timeSpent,
      lastReadAt: doc.lastReadAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(
    readingProgress: ReadingProgress,
  ): ReadingProgressPersistence {
    return {
      _id: new Types.ObjectId(readingProgress.id),
      userId: new Types.ObjectId(readingProgress.userId.toString()),
      bookId: new Types.ObjectId(readingProgress.bookId.toString()),
      chapterId: new Types.ObjectId(readingProgress.chapterId.toString()),
      progress: readingProgress.progress,
      status: readingProgress.status,
      timeSpent: readingProgress.timeSpent,
      lastReadAt: readingProgress.lastReadAt || new Date(),
      createdAt: readingProgress.createdAt,
      updatedAt: readingProgress.updatedAt,
    };
  }

  private static toChapterStatus(status: string): ChapterStatus {
    return Object.values(ChapterStatus).includes(status as ChapterStatus)
      ? (status as ChapterStatus)
      : ChapterStatus.READING;
  }

  async save(readingProgress: ReadingProgress): Promise<void> {
    const persistenceData = this.toPersistence(readingProgress);
    const { _id, ...updateData } = persistenceData;

    await this.progressModel
      .findOneAndUpdate(
        { _id },
        { $set: updateData },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findByUserIdAndChapterId(
    userId: UserId,
    chapterId: ChapterId,
  ): Promise<ReadingProgress | null> {
    const doc = await this.progressModel
      .findOne({
        userId: new Types.ObjectId(userId.toString()),
        chapterId: new Types.ObjectId(chapterId.toString()),
      })
      .lean()
      .exec();

    return doc ? this.toDomain(doc) : null;
  }

  async findByUserIdAndBookId(
    userId: UserId,
    bookId: BookId,
  ): Promise<ReadingProgress[]> {
    const docs = await this.progressModel
      .find({
        userId: new Types.ObjectId(userId.toString()),
        bookId: new Types.ObjectId(bookId.toString()),
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findByUserId(userId: UserId): Promise<ReadingProgress[]> {
    const docs = await this.progressModel
      .find({
        userId: new Types.ObjectId(userId.toString()),
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async countCompletedByBookIds(
    userId: UserId,
    bookIds: BookId[],
  ): Promise<Map<string, number>> {
    const objectIds = bookIds.map((id) => new Types.ObjectId(id.toString()));
    const results = await this.progressModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            userId: new Types.ObjectId(userId.toString()),
            bookId: { $in: objectIds },
            status: ChapterStatus.COMPLETED,
          },
        },
        { $group: { _id: '$bookId', count: { $sum: 1 } } },
      ])
      .exec();

    const map = new Map<string, number>();
    results.forEach((item) => {
      map.set(item._id.toString(), item.count);
    });
    return map;
  }

  async remove(userId: UserId, chapterId: ChapterId): Promise<void> {
    await this.progressModel
      .deleteOne({
        userId: new Types.ObjectId(userId.toString()),
        chapterId: new Types.ObjectId(chapterId.toString()),
      })
      .exec();
  }

  async exists(userId: UserId, chapterId: ChapterId): Promise<boolean> {
    const result = await this.progressModel.exists({
      userId: new Types.ObjectId(userId.toString()),
      chapterId: new Types.ObjectId(chapterId.toString()),
    });

    return !!result;
  }
}
