import { ReadingList, ReadingStatus } from "@/domain/library/entities/reading-list.entity";
import { ReadingProgress } from "@/domain/library/entities/reading-progress.entity";

export class BookLibraryInfoResponseDto {
    status: ReadingStatus | null;
    collections: CollectionResponseDto[];

    constructor(readingList: ReadingList | null, collections: CollectionResponseDto[]) {
        this.status = readingList?.status || null;
        this.collections = collections;
    }

    static fromResult(result: { readingList: ReadingList | null, collections: any[] }): BookLibraryInfoResponseDto {
        const collectionDtos = result.collections.map(c => CollectionResponseDto.fromEntity(c));
        return new BookLibraryInfoResponseDto(result.readingList, collectionDtos);
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

export class CollectionResponseDto {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    bookCount?: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(props: {
        id: string;
        name: string;
        description: string;
        isPublic: boolean;
        userId: string;
        bookCount?: number;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this.id = props.id;
        this.name = props.name;
        this.description = props.description;
        this.isPublic = props.isPublic;
        this.userId = props.userId;
        this.bookCount = props.bookCount;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static fromEntity(entity: any, bookCount?: number): CollectionResponseDto {
        return new CollectionResponseDto({
            id: entity.id,
            name: entity.name,
            description: entity.description,
            isPublic: entity.isPublic,
            userId: entity.userId.toString(),
            bookCount,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }
}

export class CollectionDetailResponseDto extends CollectionResponseDto {
    books: any[];

    constructor(props: {
        id: string;
        name: string;
        description: string;
        isPublic: boolean;
        userId: string;
        books: any[];
        createdAt: Date;
        updatedAt: Date;
    }) {
        super(props);
        this.books = props.books;
    }

    static fromResult(collection: any, books: any[]): CollectionDetailResponseDto {
        return new CollectionDetailResponseDto({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            isPublic: collection.isPublic,
            userId: collection.userId.toString(),
            books,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
        });
    }
}

export class LibraryItemResponseDto {
    id: string;
    userId: string;
    bookId: {
        id: string;
        title: string;
        slug: string;
        coverUrl: string;
        authorId: string;
    };
    status: ReadingStatus;
    lastReadChapterId: {
        id: string;
        title: string;
        slug: string;
        orderIndex: number;
    } | null;
    collectionIds: string[];
    createdAt: Date;
    updatedAt: Date;

    constructor(readModel: any) {
        this.id = readModel.id;
        this.userId = readModel.userId;
        this.bookId = readModel.bookId;
        this.status = readModel.status;
        this.lastReadChapterId = readModel.lastReadChapterId;
        this.collectionIds = readModel.collectionIds;
        this.createdAt = readModel.createdAt;
        this.updatedAt = readModel.updatedAt;
    }

    static fromReadModel(readModel: any): LibraryItemResponseDto {
        return new LibraryItemResponseDto(readModel);
    }
}

