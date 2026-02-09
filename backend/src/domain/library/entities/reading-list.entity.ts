import { ReadingListId } from '../value-objects/reading-list-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';
import { Entity } from '../../../shared/domain/entity.base';

export enum ReadingStatus {
    READING = 'READING',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
}

export class ReadingList extends Entity<ReadingListId> {
    private constructor(
        id: ReadingListId,
        private _userId: UserId,
        private _bookId: BookId,
        private _status: ReadingStatus,
        private _lastReadChapterId: ChapterId | null,
        private _collectionIds: string[],
        createdAt: Date,
        updatedAt: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        userId: string;
        bookId: string;
        status?: ReadingStatus;
        lastReadChapterId?: string | null;
        collectionIds?: string[];
    }): ReadingList {
        return new ReadingList(
            ReadingListId.generate(),
            UserId.create(props.userId),
            BookId.create(props.bookId),
            props.status || ReadingStatus.READING,
            props.lastReadChapterId ? ChapterId.create(props.lastReadChapterId) : null,
            props.collectionIds || [],
            new Date(),
            new Date()
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        bookId: string;
        status: ReadingStatus;
        lastReadChapterId: string | null;
        collectionIds: string[];
        createdAt: Date;
        updatedAt: Date;
    }): ReadingList {
        return new ReadingList(
            ReadingListId.create(props.id),
            UserId.create(props.userId),
            BookId.create(props.bookId),
            props.status,
            props.lastReadChapterId ? ChapterId.create(props.lastReadChapterId) : null,
            props.collectionIds,
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get userId(): UserId {
        return this._userId;
    }

    get bookId(): BookId {
        return this._bookId;
    }

    get status(): ReadingStatus {
        return this._status;
    }

    get lastReadChapterId(): ChapterId | null {
        return this._lastReadChapterId;
    }

    get collectionIds(): string[] {
        return [...this._collectionIds];
    }

    // Business methods
    updateStatus(status: ReadingStatus): void {
        this._status = status;
        this.markAsUpdated();
    }

    updateLastReadChapter(chapterId: string): void {
        this._lastReadChapterId = ChapterId.create(chapterId);
        this.markAsUpdated();
    }

    updateCollections(collectionIds: string[]): void {
        this._collectionIds = [...collectionIds];
        this.markAsUpdated();
    }

    addCollection(collectionId: string): void {
        if (!this._collectionIds.includes(collectionId)) {
            this._collectionIds.push(collectionId);
            this.markAsUpdated();
        }
    }

    removeCollection(collectionId: string): void {
        const index = this._collectionIds.indexOf(collectionId);
        if (index > -1) {
            this._collectionIds.splice(index, 1);
            this.markAsUpdated();
        }
    }

    isCompleted(): boolean {
        return this._status === ReadingStatus.COMPLETED;
    }

    isReading(): boolean {
        return this._status === ReadingStatus.READING;
    }

    isArchived(): boolean {
        return this._status === ReadingStatus.ARCHIVED;
    }
}

