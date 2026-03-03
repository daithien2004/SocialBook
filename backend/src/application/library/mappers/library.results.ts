export enum ReadingStatusResult {
    READING = 'reading',
    COMPLETED = 'completed',
    DROPPED = 'dropped',
    ON_HOLD = 'on_hold',
    PLAN_TO_READ = 'plan_to_read'
}

export enum ChapterStatusResult {
    UNREAD = 'unread',
    READING = 'reading',
    COMPLETED = 'completed'
}

export interface ReadingListResult {
    id: string;
    userId: string;
    bookId: string;
    status: ReadingStatusResult;
    lastReadChapterId: string | null;
    collectionIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ReadingProgressResult {
    id: string;
    userId: string;
    bookId: string;
    chapterId: string;
    progress: number;
    status: ChapterStatusResult;
    createdAt: Date;
    updatedAt: Date;
}
