import { Book } from '../../books/types/book.interface';

export enum LibraryStatus {
  READING = 'READING',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
}

export interface LibraryItem {
  id: string;
  userId: string;
  bookId: Book;
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

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface CollectionDetailResponse {
  folder: Collection;
  books: LibraryItem[];
}

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
