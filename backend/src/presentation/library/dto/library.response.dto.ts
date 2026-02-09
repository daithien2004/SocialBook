import { ReadingList, ReadingStatus } from "@/domain/library/entities/reading-list.entity";
import { ChapterStatus } from "@/domain/library/entities/reading-progress.entity";

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

    static fromArray(readingLists: ReadingList[]): ReadingListResponseDto[] {
        return readingLists.map(readingList => new ReadingListResponseDto(readingList));
    }
}

export class UpdateStatusResponseDto {
    id: string;
    bookId: string;
    status: ReadingStatus;
    updatedAt: Date;

    constructor(readingList: ReadingList) {
        this.id = readingList.id.toString();
        this.bookId = readingList.bookId.toString();
        this.status = readingList.status;
        this.updatedAt = readingList.updatedAt;
    }
}

export interface UpdateProgressResponseDto {
    readingListId: string;
    progressId: string;
    bookStatus: ReadingStatus;
    chapterProgress: number;
    chapterStatus: ChapterStatus;
}

export interface BookLibraryInfoResponseDto {
    status: ReadingStatus | null;
    collections: string[];
}

export class UpdateCollectionsResponseDto {
    id: string;
    bookId: string;
    collectionIds: string[];
    updatedAt: Date;

    constructor(readingList: ReadingList) {
        this.id = readingList.id.toString();
        this.bookId = readingList.bookId.toString();
        this.collectionIds = readingList.collectionIds;
        this.updatedAt = readingList.updatedAt;
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

