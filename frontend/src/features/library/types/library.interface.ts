// src/features/library/types/library.interface.ts
import { Book } from '../../books/types/book.interface';

// Enum trạng thái (khớp với Backend)
export enum LibraryStatus {
  READING = 'READING',
  PLAN_TO_READ = 'PLAN_TO_READ',
  ARCHIVED = 'ARCHIVED',
}

// 1. Đối tượng Sách trong Thư viện (Item trong danh sách)
export interface LibraryItem {
  id: string; // ID của ReadingList record
  userId: string;
  bookId: Book; // Đã populate thông tin sách
  status: LibraryStatus;
  lastReadChapterId?: {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;
  } | null;
  collectionIds: string[];
  updatedAt: string;
}

// 2. Đối tượng Folder (Collection)
export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
}

// 3. Response chi tiết Folder (bao gồm sách)
export interface CollectionDetailResponse {
  folder: Collection;
  books: LibraryItem[];
}

// --- REQUEST DTOs ---

export interface UpdateProgressRequest {
  bookId: string;
  chapterId: string;
  progress?: number;
}

export interface UpdateStatusRequest {
  bookId: string;
  status: LibraryStatus;
}

export interface AddToCollectionsRequest {
  bookId: string;
  collectionIds: string[];
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionRequest extends CreateCollectionRequest {}
