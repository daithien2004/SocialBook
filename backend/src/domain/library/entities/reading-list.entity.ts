import { Entity } from '@/shared/domain/entity.base';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export enum ReadingStatus {
    READING = 'READING',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
}

export interface ReadingListProps {
    userId: UserId;
    bookId: BookId;
    status: ReadingStatus;
    lastReadChapterId: ChapterId | null;
    collectionIds: string[];
}

export class ReadingList extends Entity<string> {
    private _props: ReadingListProps;

    private constructor(id: string, props: ReadingListProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: string;
        userId: string;
        bookId: string;
        status?: ReadingStatus;
        lastReadChapterId?: string | null;
        collectionIds?: string[];
    }): ReadingList {
        return new ReadingList(
            props.id,
            {
                userId: UserId.create(props.userId),
                bookId: BookId.create(props.bookId),
                status: props.status || ReadingStatus.READING,
                lastReadChapterId: props.lastReadChapterId ? ChapterId.create(props.lastReadChapterId) : null,
                collectionIds: props.collectionIds || []
            }
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
            {
                userId: UserId.create(props.userId),
                bookId: BookId.create(props.bookId),
                status: props.status,
                lastReadChapterId: props.lastReadChapterId ? ChapterId.create(props.lastReadChapterId) : null,
                collectionIds: props.collectionIds
            },
            props.createdAt,
            props.updatedAt
        );
    }

    get userId(): UserId { return this._props.userId; }
    get bookId(): BookId { return this._props.bookId; }
    get status(): ReadingStatus { return this._props.status; }
    get lastReadChapterId(): ChapterId | null { return this._props.lastReadChapterId; }
    get collectionIds(): string[] { return [...this._props.collectionIds]; }

    updateStatus(status: ReadingStatus): void {
        this._props.status = status;
        this.markAsUpdated();
    }

    updateLastReadChapter(chapterId: string): void {
        this._props.lastReadChapterId = ChapterId.create(chapterId);
        this.markAsUpdated();
    }

    updateCollections(collectionIds: string[]): void {
        this._props.collectionIds = [...collectionIds];
        this.markAsUpdated();
    }

    addCollection(collectionId: string): void {
        if (!this._props.collectionIds.includes(collectionId)) {
            this._props.collectionIds.push(collectionId);
            this.markAsUpdated();
        }
    }

    removeCollection(collectionId: string): void {
        const index = this._props.collectionIds.indexOf(collectionId);
        if (index > -1) {
            this._props.collectionIds.splice(index, 1);
            this.markAsUpdated();
        }
    }

    isCompleted(): boolean {
        return this._props.status === ReadingStatus.COMPLETED;
    }

    isReading(): boolean {
        return this._props.status === ReadingStatus.READING;
    }

    isArchived(): boolean {
        return this._props.status === ReadingStatus.ARCHIVED;
    }
}
