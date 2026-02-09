import { ReadingList, ReadingStatus } from "@/domain/library/entities/reading-list.entity";
import { ReadingProgress, ChapterStatus } from "@/domain/library/entities/reading-progress.entity";

export class ReadingListResponseDto {
    id: string;
    bookId: string;
    status: ReadingStatus;
    lastReadChapterId: string | null;
    collectionIds: string[];
    createdAt: Date;
    updatedAt: Date;

    constructor(readingList: ReadingList) {
        this.id = readingList.id.toString();
        this.bookId = readingList.bookId.toString();
        this.status = readingList.status;
        this.lastReadChapterId = readingList.lastReadChapterId?.toString() || null;
        this.collectionIds = readingList.collectionIds;
        this.createdAt = readingList.createdAt;
        this.updatedAt = readingList.updatedAt;
    }

    static fromEntity(readingList: ReadingList): ReadingListResponseDto {
        return new ReadingListResponseDto(readingList);
    }

    static fromArray(readingLists: ReadingList[]): ReadingListResponseDto[] {
        return readingLists.map(readingList => new ReadingListResponseDto(readingList));
    }
}

export class BookLibraryInfoResponseDto {
    status: ReadingStatus | null;
    collections: string[];

    constructor(readingList: ReadingList | null) {
        if (readingList) {
            this.status = readingList.status;
            this.collections = readingList.collectionIds;
        } else {
            this.status = null;
            this.collections = [];
        }
    }

    static fromEntity(readingList: ReadingList | null): BookLibraryInfoResponseDto {
        return new BookLibraryInfoResponseDto(readingList);
    }
}

export class UpdateProgressResponseDto {
    readingListId: string;
    progressId: string;
    bookStatus: ReadingStatus;
    chapterProgress: number;
    chapterStatus: ChapterStatus;

    constructor(readingList: ReadingList, readingProgress: ReadingProgress) {
        this.readingListId = readingList.id;
        this.progressId = readingProgress.id;
        this.bookStatus = readingList.status;
        this.chapterProgress = readingProgress.progress;
        this.chapterStatus = readingProgress.status;
    }

    static fromEntities(readingList: ReadingList, readingProgress: ReadingProgress): UpdateProgressResponseDto {
        return new UpdateProgressResponseDto(readingList, readingProgress);
    }
}

export class ChapterProgressResponseDto {
    progress: number;

    constructor(readingProgress: ReadingProgress | null) {
        this.progress = readingProgress?.progress || 0;
    }

    static fromEntity(readingProgress: ReadingProgress | null): ChapterProgressResponseDto {
        return new ChapterProgressResponseDto(readingProgress);
    }
}

export class RecordReadingTimeResponseDto {
    success: boolean;
    timeSpentMinutes: number;

    constructor(timeSpentMinutes: number) {
        this.success = true;
        this.timeSpentMinutes = timeSpentMinutes;
    }

    static fromResult(timeSpentMinutes: number): RecordReadingTimeResponseDto {
        return new RecordReadingTimeResponseDto(timeSpentMinutes);
    }
}

export interface CollectionResponseDto {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    bookCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CollectionDetailResponseDto extends CollectionResponseDto {
    books: BookInCollectionDto[];
}

export interface BookInCollectionDto {
    id: string;
    title: string;
    coverUrl: string;
    authorId: string;
}

