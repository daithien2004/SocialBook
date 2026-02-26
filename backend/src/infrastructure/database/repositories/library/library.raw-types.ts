import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { Types } from 'mongoose';

export interface RawReadingListDocument {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    bookId: Types.ObjectId;
    status: ReadingStatus;
    lastReadChapterId: Types.ObjectId | null;
    collectionIds: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ReadingListPersistence {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    bookId: Types.ObjectId;
    status: ReadingStatus;
    lastReadChapterId: Types.ObjectId | null;
    collectionIds: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PopulatedBook {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    coverUrl: string;
    authorId: Types.ObjectId;
}

export interface PopulatedChapter {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    orderIndex: number;
}

export interface PopulatedReadingListDocument extends Omit<RawReadingListDocument, 'bookId' | 'lastReadChapterId'> {
    bookId: PopulatedBook;
    lastReadChapterId: PopulatedChapter | null;
}
