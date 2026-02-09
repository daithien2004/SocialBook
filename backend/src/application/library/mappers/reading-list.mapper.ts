import { ReadingList, ReadingStatus } from '@/domain/library/entities/reading-list.entity';

export interface ReadingListFullDto {
    id: string;
    bookId: string;
    status: ReadingStatus;
    lastReadChapterId: string | null;
    collectionIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ReadingListStatusDto {
    id: string;
    bookId: string;
    status: ReadingStatus;
    updatedAt: Date;
}

export interface ReadingListCollectionsDto {
    id: string;
    bookId: string;
    collectionIds: string[];
    updatedAt: Date;
}

export interface ReadingListInfoDto {
    status: ReadingStatus | null;
    collections: string[];
}


// mapping logic
export class ReadingListMapper {
    /**
     * Map to full DTO with all fields
     */
    static toFullDto(entity: ReadingList): ReadingListFullDto {
        return {
            id: entity.id.toString(),
            bookId: entity.bookId.toString(),
            status: entity.status,
            lastReadChapterId: entity.lastReadChapterId?.toString() || null,
            collectionIds: entity.collectionIds,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    /**
     * Map multiple entities to full DTOs
     */
    static toFullDtoList(entities: ReadingList[]): ReadingListFullDto[] {
        return entities.map(entity => this.toFullDto(entity));
    }

    /**
     * Map to status-focused DTO (for update status response)
     */
    static toStatusDto(entity: ReadingList): ReadingListStatusDto {
        return {
            id: entity.id.toString(),
            bookId: entity.bookId.toString(),
            status: entity.status,
            updatedAt: entity.updatedAt,
        };
    }

    /**
     * Map to collections-focused DTO (for update collections response)
     */
    static toCollectionsDto(entity: ReadingList): ReadingListCollectionsDto {
        return {
            id: entity.id.toString(),
            bookId: entity.bookId.toString(),
            collectionIds: entity.collectionIds,
            updatedAt: entity.updatedAt,
        };
    }

    /**
     * Map to info DTO (for get book library info)
     */
    static toInfoDto(entity: ReadingList | null): ReadingListInfoDto {
        if (!entity) {
            return {
                status: null,
                collections: [],
            };
        }
        return {
            status: entity.status,
            collections: entity.collectionIds,
        };
    }
}
