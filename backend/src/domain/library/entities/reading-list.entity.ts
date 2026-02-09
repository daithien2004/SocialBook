import { UserId } from '../value-objects/user-id.vo';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';

export enum ReadingStatus {
    READING = 'READING',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
}

export class ReadingList {
    private constructor(
        public readonly id: string,
        private _userId: UserId,
        private _bookId: BookId,
        private _status: ReadingStatus,
        private _lastReadChapterId: ChapterId | null,
        private _collectionIds: string[],
        public readonly createdAt: Date,
        private _updatedAt: Date
    ) {}

    static create(props: {
        userId: string;
        bookId: string;
        status?: ReadingStatus;
        lastReadChapterId?: string | null;
        collectionIds?: string[];
    }): ReadingList {
        return new ReadingList(
            crypto.randomUUID(),
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
            props.id,
            UserId.create(props.userId),
            BookId.create(props.bookId),
            props.status,
            props.lastReadChapterId ? ChapterId.create(props.lastReadChapterId) : null,
            props.collectionIds,
            props.createdAt,
            props.updatedAt
        );
    }

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

    get updatedAt(): Date {
        return this._updatedAt;
    }

    updateStatus(status: ReadingStatus): void {
        this._status = status;
        this._updatedAt = new Date();
    }

    updateLastReadChapter(chapterId: string): void {
        this._lastReadChapterId = ChapterId.create(chapterId);
        this._updatedAt = new Date();
    }

    updateCollections(collectionIds: string[]): void {
        this._collectionIds = [...collectionIds];
        this._updatedAt = new Date();
    }

    addCollection(collectionId: string): void {
        if (!this._collectionIds.includes(collectionId)) {
            this._collectionIds.push(collectionId);
            this._updatedAt = new Date();
        }
    }

    removeCollection(collectionId: string): void {
        const index = this._collectionIds.indexOf(collectionId);
        if (index > -1) {
            this._collectionIds.splice(index, 1);
            this._updatedAt = new Date();
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
