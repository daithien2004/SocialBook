import { ReadingList, ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { ReadingListDocument } from '@/infrastructure/database/schemas/reading-list.schema';
import { Types } from 'mongoose';

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

export class ReadingListMapper {
  static toDomain(doc: ReadingListDocument | any): ReadingList {
    return ReadingList.reconstitute({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      bookId: doc.bookId.toString(),
      status: doc.status,
      lastReadChapterId: doc.lastReadChapterId?.toString() || null,
      collectionIds: doc.collectionIds.map((id: any) => id.toString()),
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date
    });
  }

  static toPersistence(readingList: ReadingList): ReadingListPersistence {
    return {
      _id: new Types.ObjectId(readingList.id),
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
}
