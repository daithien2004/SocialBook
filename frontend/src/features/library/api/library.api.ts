import { NESTJS_LIBRARY_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/api-client';
import {
  AddToCollectionsRequest,
  Collection,
  CollectionDetailResponse,
  CreateCollectionRequest,
  GetBookLibraryInfoResult,
  KnowledgeGraphData,
  LibraryItem,
  LibraryStatus,
  UpdateCollectionRequest,
  UpdateProgressRequest,
  UpdateStatusRequest,
} from '../types/library.interface';

export type {
  AddToCollectionsRequest,
  Collection,
  CollectionDetailResponse,
  CreateCollectionRequest,
  GetBookLibraryInfoResult,
  KnowledgeGraphData,
  LibraryItem,
  LibraryStatus,
  UpdateCollectionRequest,
  UpdateProgressRequest,
  UpdateStatusRequest,
} from '../types/library.interface';

export interface UpdateReadingProgressResult {
  readingList: LibraryItem;
  readingProgress: { progress: number };
}

export async function getLibraryBooks(params: {
  status: LibraryStatus | string;
  limit?: number;
}): Promise<LibraryItem[]> {
  return apiRequest<LibraryItem[]>({
    url: NESTJS_LIBRARY_ENDPOINTS.getLibrary,
    method: 'GET',
    params: {
      status: params.status,
      ...(params.limit ? { limit: params.limit } : {}),
    },
  });
}

export async function updateLibraryStatus(data: UpdateStatusRequest): Promise<LibraryItem> {
  return apiRequest<LibraryItem>({
    url: NESTJS_LIBRARY_ENDPOINTS.updateStatus,
    method: 'POST',
    data,
  });
}

export async function getChapterProgress(params: {
  bookId: string;
  chapterId: string;
}): Promise<{ progress: number }> {
  return apiRequest<{ progress: number }>({
    url: NESTJS_LIBRARY_ENDPOINTS.updateProgress,
    method: 'GET',
    params,
  });
}

export async function updateReadingProgress(
  data: UpdateProgressRequest,
): Promise<UpdateReadingProgressResult> {
  return apiRequest<UpdateReadingProgressResult>({
    url: NESTJS_LIBRARY_ENDPOINTS.updateProgress,
    method: 'POST',
    data,
  });
}

export async function addBookToCollections(data: AddToCollectionsRequest): Promise<LibraryItem> {
  return apiRequest<LibraryItem>({
    url: NESTJS_LIBRARY_ENDPOINTS.updateBookCollections,
    method: 'PATCH',
    data,
  });
}

export async function removeBookFromLibrary(bookId: string): Promise<null> {
  return apiRequest<null>({
    url: NESTJS_LIBRARY_ENDPOINTS.removeBook(bookId),
    method: 'DELETE',
  });
}

export async function getBookLibraryInfo(bookId: string): Promise<GetBookLibraryInfoResult> {
  return apiRequest<GetBookLibraryInfoResult>({
    url: NESTJS_LIBRARY_ENDPOINTS.getBookLibraryInfo(bookId),
    method: 'GET',
  });
}

export async function getCollections(userId?: string | null): Promise<Collection[]> {
  return apiRequest<Collection[]>({
    url: `${NESTJS_LIBRARY_ENDPOINTS.collections}?userId=${userId ?? ''}`,
    method: 'GET',
  });
}

export async function getCollectionDetail(id: string): Promise<CollectionDetailResponse> {
  return apiRequest<CollectionDetailResponse>({
    url: NESTJS_LIBRARY_ENDPOINTS.collectionDetail(id),
    method: 'GET',
  });
}

export async function getCollectionDetailUser(params: {
  id: string;
  userId: string;
}): Promise<CollectionDetailResponse> {
  return apiRequest<CollectionDetailResponse>({
    url: NESTJS_LIBRARY_ENDPOINTS.collectionDetailUser(params.userId, params.id),
    method: 'GET',
  });
}

export async function createCollection(data: CreateCollectionRequest): Promise<Collection> {
  return apiRequest<Collection>({
    url: NESTJS_LIBRARY_ENDPOINTS.collections,
    method: 'POST',
    data,
  });
}

export async function updateCollection(payload: {
  id: string;
  data: UpdateCollectionRequest;
}): Promise<Collection> {
  return apiRequest<Collection>({
    url: NESTJS_LIBRARY_ENDPOINTS.collectionDetail(payload.id),
    method: 'PATCH',
    data: payload.data,
  });
}

export async function deleteCollection(id: string): Promise<null> {
  return apiRequest<null>({
    url: NESTJS_LIBRARY_ENDPOINTS.collectionDetail(id),
    method: 'DELETE',
  });
}

export async function recordReadingTime(body: {
  bookId: string;
  chapterId: string;
  durationInSeconds: number;
}): Promise<void> {
  return apiRequest<void>({
    url: NESTJS_LIBRARY_ENDPOINTS.readingTime,
    method: 'POST',
    data: body,
  });
}

export async function getKnowledgeGraph(): Promise<KnowledgeGraphData> {
  return apiRequest<KnowledgeGraphData>({
    url: NESTJS_LIBRARY_ENDPOINTS.knowledgeGraph,
    method: 'GET',
  });
}