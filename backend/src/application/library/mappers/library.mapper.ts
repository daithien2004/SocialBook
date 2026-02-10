import { ReadingList } from "@/domain/library/entities/reading-list.entity";
import { ReadingProgress } from "@/domain/library/entities/reading-progress.entity";
import { Collection } from "@/domain/library/entities/collection.entity";
import { ReadingListResult, ReadingProgressResult, ReadingStatusResult, ChapterStatusResult } from "./library.results";
import { CollectionResult } from "../use-cases/get-book-library-info/get-book-library-info.use-case";

export class LibraryApplicationMapper {
    static toListResult(readingList: ReadingList): ReadingListResult {
        return {
            id: readingList.id.toString(),
            userId: readingList.userId.toString(),
            bookId: readingList.bookId.toString(),
            status: readingList.status as unknown as ReadingStatusResult,
            lastReadChapterId: readingList.lastReadChapterId?.toString() || null,
            collectionIds: readingList.collectionIds,
            createdAt: readingList.createdAt,
            updatedAt: readingList.updatedAt,
        };
    }

    static toCollectionResult(collection: Collection): CollectionResult {
        return {
            id: collection.id.toString(),
            name: collection.name,
            description: collection.description,
            isPublic: collection.isPublic,
            userId: collection.userId.toString(),
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
        };
    }

    static toProgressResult(progress: ReadingProgress): ReadingProgressResult {
        return {
            id: progress.id.toString(),
            userId: progress.userId.toString(),
            bookId: progress.bookId.toString(),
            chapterId: progress.chapterId.toString(),
            progress: progress.progress,
            status: progress.status as unknown as ChapterStatusResult,
            createdAt: progress.createdAt,
            updatedAt: progress.updatedAt,
        };
    }
}
