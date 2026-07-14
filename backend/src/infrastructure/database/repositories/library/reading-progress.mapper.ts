import {
  ReadingProgress,
  ChapterStatus,
} from '@/domain/library/entities/reading-progress.entity';
import { ProgressDocument } from '@/infrastructure/database/schemas/progress.schema';
import { Types } from 'mongoose';
export interface ReadingProgressPersistence {
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

export class ReadingProgressMapper {
  static toDomain(doc: ProgressDocument): ReadingProgress {
    const status = ReadingProgressMapper.toChapterStatus(doc.status);

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

  static toPersistence(
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
}
