import { UserId } from '../value-objects/user-id.vo';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';

export enum ChapterStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

export class ReadingProgress {
    private constructor(
        public readonly id: string,
        private _userId: UserId,
        private _bookId: BookId,
        private _chapterId: ChapterId,
        private _progress: number,
        private _status: ChapterStatus,
        private _timeSpent: number,
        private _lastReadAt: Date | null,
        public readonly createdAt: Date,
        private _updatedAt: Date
    ) {}

    static create(props: {
        userId: string;
        bookId: string;
        chapterId: string;
        progress?: number;
        status?: ChapterStatus;
        timeSpent?: number;
    }): ReadingProgress {
        return new ReadingProgress(
            crypto.randomUUID(),
            UserId.create(props.userId),
            BookId.create(props.bookId),
            ChapterId.create(props.chapterId),
            props.progress || 0,
            props.status || ChapterStatus.NOT_STARTED,
            props.timeSpent || 0,
            null,
            new Date(),
            new Date()
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        bookId: string;
        chapterId: string;
        progress: number;
        status: ChapterStatus;
        timeSpent: number;
        lastReadAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }): ReadingProgress {
        return new ReadingProgress(
            props.id,
            UserId.create(props.userId),
            BookId.create(props.bookId),
            ChapterId.create(props.chapterId),
            props.progress,
            props.status,
            props.timeSpent,
            props.lastReadAt,
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

    get chapterId(): ChapterId {
        return this._chapterId;
    }

    get progress(): number {
        return this._progress;
    }

    get status(): ChapterStatus {
        return this._status;
    }

    get timeSpent(): number {
        return this._timeSpent;
    }

    get lastReadAt(): Date | null {
        return this._lastReadAt;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    updateProgress(progress: number): void {
        this._progress = Math.max(0, Math.min(100, progress));
        this._status = this._progress >= 80 ? ChapterStatus.COMPLETED : 
                      this._progress > 0 ? ChapterStatus.IN_PROGRESS : ChapterStatus.NOT_STARTED;
        this._lastReadAt = new Date();
        this._updatedAt = new Date();
    }

    addTimeSpent(seconds: number): void {
        this._timeSpent += Math.max(0, seconds);
        this._updatedAt = new Date();
    }

    markAsCompleted(): void {
        this._progress = 100;
        this._status = ChapterStatus.COMPLETED;
        this._lastReadAt = new Date();
        this._updatedAt = new Date();
    }

    isCompleted(): boolean {
        return this._status === ChapterStatus.COMPLETED;
    }

    isInProgress(): boolean {
        return this._status === ChapterStatus.IN_PROGRESS;
    }

    isNotStarted(): boolean {
        return this._status === ChapterStatus.NOT_STARTED;
    }

    getTimeSpentInMinutes(): number {
        return Math.round(this._timeSpent / 60);
    }

    getTimeSpentInHours(): number {
        return Math.round(this._timeSpent / 3600 * 100) / 100;
    }
}
