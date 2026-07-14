import { Entity } from '@/shared/domain/entity.base';
import { BookId } from '../value-objects/book-id.vo';
import { ChapterId } from '../value-objects/chapter-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export enum ChapterStatus {
  READING = 'READING',
  COMPLETED = 'COMPLETED',
}

export interface ReadingProgressProps {
  userId: UserId;
  bookId: BookId;
  chapterId: ChapterId;
  progress: number;
  status: ChapterStatus;
  timeSpent: number;
  lastReadAt: Date | null;
}

export class ReadingProgress extends Entity<string> {
  private _props: ReadingProgressProps;

  private constructor(
    id: string,
    props: ReadingProgressProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: string;
    userId: string;
    bookId: string;
    chapterId: string;
    progress?: number;
    status?: ChapterStatus;
    timeSpent?: number;
  }): ReadingProgress {
    return new ReadingProgress(props.id, {
      userId: UserId.create(props.userId),
      bookId: BookId.create(props.bookId),
      chapterId: ChapterId.create(props.chapterId),
      progress: props.progress || 0,
      status: props.status || ChapterStatus.READING,
      timeSpent: props.timeSpent || 0,
      lastReadAt: null,
    });
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
      {
        userId: UserId.create(props.userId),
        bookId: BookId.create(props.bookId),
        chapterId: ChapterId.create(props.chapterId),
        progress: props.progress,
        status: props.status,
        timeSpent: props.timeSpent,
        lastReadAt: props.lastReadAt,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): UserId {
    return this._props.userId;
  }
  get bookId(): BookId {
    return this._props.bookId;
  }
  get chapterId(): ChapterId {
    return this._props.chapterId;
  }
  get progress(): number {
    return this._props.progress;
  }
  get status(): ChapterStatus {
    return this._props.status;
  }
  get timeSpent(): number {
    return this._props.timeSpent;
  }
  get lastReadAt(): Date | null {
    return this._props.lastReadAt;
  }

  updateProgress(progress: number): void {
    this._props.progress = Math.max(0, Math.min(100, progress));
    this._props.status =
      this._props.progress >= 100
        ? ChapterStatus.COMPLETED
        : ChapterStatus.READING;
    this._props.lastReadAt = new Date();
    this.markAsUpdated();
  }

  addTimeSpent(seconds: number): void {
    this._props.timeSpent += Math.max(0, seconds);
    this.markAsUpdated();
  }

  markAsCompleted(): void {
    this._props.progress = 100;
    this._props.status = ChapterStatus.COMPLETED;
    this._props.lastReadAt = new Date();
    this.markAsUpdated();
  }

  isCompleted(): boolean {
    return this._props.status === ChapterStatus.COMPLETED;
  }

  isReading(): boolean {
    return this._props.status === ChapterStatus.READING;
  }

  getTimeSpentInMinutes(): number {
    return Math.round(this._props.timeSpent / 60);
  }

  getTimeSpentInHours(): number {
    return Math.round((this._props.timeSpent / 3600) * 100) / 100;
  }
}
