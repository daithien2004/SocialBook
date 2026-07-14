import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import {
  ReadingListResult,
  ReadingProgressResult,
} from '@/application/library/dto/library.dto';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';

/** Accepts either domain Collection entity (userId: UserId) or CollectionResult (userId: string) */
type CollectionInput = {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  userId: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

export class BookLibraryInfoResponseDto {
  status: ReadingStatus | null;
  collections: CollectionResponseDto[];
  completedChaptersCount: number;
  totalChapters: number;

  constructor(
    readingList: ReadingListResult | null,
    collections: CollectionResponseDto[],
    completedChaptersCount: number,
    totalChapters: number,
  ) {
    this.status =
      readingList?.status === ReadingStatus.NONE
        ? null
        : readingList?.status || null;
    this.collections = collections;
    this.completedChaptersCount = completedChaptersCount;
    this.totalChapters = totalChapters;
  }

  static fromResult(result: {
    readingList: ReadingListResult | null;
    collections: CollectionInput[];
    completedChaptersCount: number;
    totalChapters: number;
  }): BookLibraryInfoResponseDto {
    const collectionDtos = result.collections.map((c) =>
      CollectionResponseDto.fromResult(c),
    );
    return new BookLibraryInfoResponseDto(
      result.readingList,
      collectionDtos,
      result.completedChaptersCount,
      result.totalChapters,
    );
  }
}

export class ChapterProgressResponseDto {
  progress: number;

  constructor(readingProgress: ReadingProgressResult | null) {
    this.progress = readingProgress?.progress || 0;
  }

  static fromResult(
    readingProgress: ReadingProgressResult | null,
  ): ChapterProgressResponseDto {
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

  static fromResult(
    entity: CollectionInput,
    bookCount?: number,
  ): CollectionResponseDto {
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
  books: LibraryItemReadModel[];

  constructor(props: {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    userId: string;
    books: LibraryItemReadModel[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props);
    this.books = props.books;
  }

  static fromResultDetail(
    collection: CollectionInput,
    books: LibraryItemReadModel[],
  ): CollectionDetailResponseDto {
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
    authorName: string;
  };
  status: ReadingStatus;
  lastReadChapterId: {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;
  } | null;
  collectionIds: string[];
  totalChapters?: number;
  completedChapters?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(readModel: LibraryItemReadModel) {
    this.id = readModel.id;
    this.userId = readModel.userId;
    this.bookId = readModel.bookId;
    this.status = readModel.status;
    this.lastReadChapterId = readModel.lastReadChapterId;
    this.collectionIds = readModel.collectionIds;
    this.totalChapters = readModel.totalChapters;
    this.completedChapters = readModel.completedChapters;
    this.createdAt = readModel.createdAt;
    this.updatedAt = readModel.updatedAt;
  }

  static fromReadModel(
    readModel: LibraryItemReadModel,
  ): LibraryItemResponseDto {
    return new LibraryItemResponseDto(readModel);
  }
}
