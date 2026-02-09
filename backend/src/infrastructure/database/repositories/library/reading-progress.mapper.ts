import { ReadingProgress, ChapterStatus } from '@/domain/library/entities/reading-progress.entity';
import { ProgressDocument } from '@/infrastructure/database/schemas/progress.schema';
import { ReadingStatus } from '@/infrastructure/database/schemas/reading-list.schema';
import { Types } from 'mongoose';

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

export class ReadingProgressMapper {
  static toDomain(doc: ProgressDocument | any): ReadingProgress {
    const status = ReadingProgressMapper.mapStatusToChapterStatus(doc.status);
    
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

  static toPersistence(readingProgress: ReadingProgress): ReadingProgressPersistence {
    return {
      _id: new Types.ObjectId(readingProgress.id),
      userId: new Types.ObjectId(readingProgress.userId.toString()),
      bookId: new Types.ObjectId(readingProgress.bookId.toString()),
      chapterId: new Types.ObjectId(readingProgress.chapterId.toString()),
      progress: readingProgress.progress,
      status: ReadingProgressMapper.mapChapterStatusToStatus(readingProgress.status),
      timeSpent: readingProgress.timeSpent,
      lastReadAt: readingProgress.lastReadAt || new Date(),
      createdAt: readingProgress.createdAt,
      updatedAt: readingProgress.updatedAt
    };
  }

  private static mapStatusToChapterStatus(status: string): ChapterStatus {
    switch (status) {
      case ReadingStatus.COMPLETED:
        return ChapterStatus.COMPLETED;
      case ReadingStatus.READING:
        return ChapterStatus.IN_PROGRESS;
      default:
        return ChapterStatus.NOT_STARTED;
    }
  }

  private static mapChapterStatusToStatus(status: ChapterStatus): string {
    switch (status) {
      case ChapterStatus.COMPLETED:
        return ReadingStatus.COMPLETED;
      case ChapterStatus.IN_PROGRESS:
        return ReadingStatus.READING;
      default:
        return ReadingStatus.READING;
    }
  }
}
