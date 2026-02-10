import { ReadingList } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';
import { Types } from 'mongoose';
import { PopulatedReadingListDocument, RawReadingListDocument, ReadingListPersistence } from './library.raw-types';

export class LibraryMapper {
    static toDomain(doc: RawReadingListDocument): ReadingList {
        return ReadingList.reconstitute({
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bookId: doc.bookId.toString(),
            status: doc.status,
            lastReadChapterId: doc.lastReadChapterId?.toString() || null,
            collectionIds: doc.collectionIds.map((id) => id.toString()),
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    static toReadModel(doc: PopulatedReadingListDocument): LibraryItemReadModel {
        return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            bookId: {
                id: doc.bookId._id.toString(),
                title: doc.bookId.title,
                slug: doc.bookId.slug,
                coverUrl: doc.bookId.coverUrl,
                authorId: doc.bookId.authorId.toString(),
            },
            status: doc.status,
            lastReadChapterId: doc.lastReadChapterId
                ? {
                    id: doc.lastReadChapterId._id.toString(),
                    title: doc.lastReadChapterId.title,
                    slug: doc.lastReadChapterId.slug,
                    orderIndex: doc.lastReadChapterId.orderIndex,
                }
                : null,
            collectionIds: doc.collectionIds.map((id) => id.toString()),
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
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
            collectionIds: readingList.collectionIds.map((id) => new Types.ObjectId(id)),
            createdAt: readingList.createdAt,
            updatedAt: readingList.updatedAt,
        };
    }
}
