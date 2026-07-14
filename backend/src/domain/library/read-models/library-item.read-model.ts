import { ReadingStatus } from '@/domain/library/enums/reading-status.enum';

export interface LibraryBookSummary {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  authorName: string;
}

export interface LibraryChapterSummary {
  id: string;
  title: string;
  slug: string;
  orderIndex: number;
}

export interface LibraryItemReadModel {
  id: string;
  userId: string;
  bookId: LibraryBookSummary;
  status: ReadingStatus;
  lastReadChapterId: LibraryChapterSummary | null;
  collectionIds: string[];
  totalChapters?: number;
  completedChapters?: number;
  createdAt: Date;
  updatedAt: Date;
}
