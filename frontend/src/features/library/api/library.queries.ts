import { libraryKeys } from '@/lib/query-keys';
import { GC_TIME, STALE_TIME } from '@/lib/query-constants';
import {
  getBookLibraryInfo,
  getChapterProgress,
  getCollectionDetail,
  getCollectionDetailUser,
  getCollections,
  getKnowledgeGraph,
  getLibraryBooks,
} from './library.api';
import type {
  Collection,
  CollectionDetailResponse,
  GetBookLibraryInfoResult,
  KnowledgeGraphData,
  LibraryItem,
  LibraryStatus,
} from '../types/library.interface';

export const libraryQueries = {
  books: (params: { status: LibraryStatus | string; limit?: number }) => ({
    queryKey: libraryKeys.books(params.status, params.limit),
    queryFn: (): Promise<LibraryItem[]> => getLibraryBooks(params),
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
  chapterProgress: (params: { bookId: string; chapterId: string }) => ({
    queryKey: libraryKeys.chapterProgress(params.bookId, params.chapterId),
    queryFn: (): Promise<{ progress: number }> => getChapterProgress(params),
    gcTime: 0,
  }),
  bookInfo: (bookId: string) => ({
    queryKey: libraryKeys.bookInfo(bookId),
    queryFn: (): Promise<GetBookLibraryInfoResult> => getBookLibraryInfo(bookId),
  }),
  collections: (userId?: string | null) => ({
    queryKey: libraryKeys.collections(userId ?? null),
    queryFn: (): Promise<Collection[]> => getCollections(userId ?? undefined),
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
  collectionDetail: (id: string) => ({
    queryKey: libraryKeys.collectionDetail(id),
    queryFn: (): Promise<CollectionDetailResponse> => getCollectionDetail(id),
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
  collectionDetailUser: (params: { id: string; userId: string }) => ({
    queryKey: libraryKeys.collectionDetailUser(params.userId, params.id),
    queryFn: (): Promise<CollectionDetailResponse> => getCollectionDetailUser(params),
    staleTime: STALE_TIME.SEMI_STATIC,
    gcTime: GC_TIME.SEMI_STATIC,
  }),
  knowledgeGraph: () => ({
    queryKey: libraryKeys.knowledgeGraph(),
    queryFn: (): Promise<KnowledgeGraphData> => getKnowledgeGraph(),
    staleTime: 60 * 60 * 1000,
  }),
};