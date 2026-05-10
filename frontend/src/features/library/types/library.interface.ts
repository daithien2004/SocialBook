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

export interface CollectionDetailResponse extends Collection {
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

export interface UpdateCollectionRequest extends CreateCollectionRequest { }

export interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'book' | 'genre' | 'author' | 'tag';
  val: number;
  img?: string;
  color?: string;
  isGap?: boolean;
  reason?: string;
}


export interface GraphLink {
  source: string;
  target: string;
  type: 'read' | 'belongs_to' | 'written_by' | 'has_tag' | 'semantic';
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

