import { VectorDocument } from '../entities/vector-document.entity';
import { SearchQuery } from '../entities/search-query.entity';
import { VectorId } from '../value-objects/vector-id.vo';
import { ContentType } from '../value-objects/content-type.vo';

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

export interface IndexResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export interface BatchIndexResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{ contentId: string; error: string }>;
}

export interface CollectionStats {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  totalEmbeddings: number;
  collectionSize: number;
  lastUpdated: Date;
}

export abstract class IVectorRepository {
  // Document operations
  abstract save(document: VectorDocument): Promise<void>;
  abstract saveBatch(documents: VectorDocument[]): Promise<BatchIndexResult>;
  abstract findById(id: VectorId): Promise<VectorDocument | null>;
  abstract findByContentId(
    contentId: string,
    contentType?: ContentType,
  ): Promise<VectorDocument[]>;
  abstract deleteById(id: VectorId): Promise<void>;
  abstract deleteByContentId(
    contentId: string,
    contentType?: ContentType,
  ): Promise<void>;

  // Embedding
  abstract embedQuery(text: string): Promise<number[]>;

  // Search operations
  abstract search(query: SearchQuery): Promise<SearchResult[]>;
  abstract searchByContent(
    content: string,
    contentType?: ContentType,
    limit?: number,
  ): Promise<SearchResult[]>;
  abstract findSimilar(
    documentId: VectorId,
    limit?: number,
    threshold?: number,
  ): Promise<SearchResult[]>;

  // Collection operations
  abstract clearCollection(): Promise<void>;
  abstract getCollectionStats(): Promise<CollectionStats>;

  // Content type specific operations (used by BatchIndexUseCase)
  abstract indexBooks(bookIds: string[]): Promise<BatchIndexResult>;
  abstract indexAuthors(authorIds: string[]): Promise<BatchIndexResult>;
  abstract indexChapters(chapterIds: string[]): Promise<BatchIndexResult>;
}
