export enum LibraryStatus {
  READING = 'READING',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
  NONE = 'NONE',
}

export interface BookSummary {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  authorName: string;
}

export interface LibraryItem {
  id: string;
  userId: string;
  bookId: BookSummary;
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
  userId: string;
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

export interface GetBookLibraryInfoResult {
  status: LibraryStatus | null;
  collections: Collection[];
  completedChaptersCount: number;
  totalChapters: number;
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

export type UpdateCollectionRequest = CreateCollectionRequest;

export interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'book' | 'genre' | 'author' | 'tag';
  val: number;
  img?: string;
  color?: string;
  isGap?: boolean;
  reason?: string;
  slug?: string;
  url?: string;
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

