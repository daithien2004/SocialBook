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
    abstract findById(id: VectorId): Promise<VectorDocument | null>;
    abstract findByContentId(contentId: string, contentType?: ContentType): Promise<VectorDocument[]>;
    abstract deleteById(id: VectorId): Promise<void>;
    abstract deleteByContentId(contentId: string, contentType?: ContentType): Promise<void>;
    
    // Search operations
    abstract search(query: SearchQuery): Promise<SearchResult[]>;
    abstract searchByContent(content: string, contentType?: ContentType, limit?: number): Promise<SearchResult[]>;
    abstract findSimilar(documentId: VectorId, limit?: number, threshold?: number): Promise<SearchResult[]>;
    
    // Batch operations
    abstract saveBatch(documents: VectorDocument[]): Promise<BatchIndexResult>;
    abstract deleteBatch(ids: VectorId[]): Promise<BatchIndexResult>;
    abstract deleteByContentType(contentType: ContentType): Promise<void>;
    
    // Collection operations
    abstract clearCollection(): Promise<void>;
    abstract getCollectionStats(): Promise<CollectionStats>;
    abstract optimizeCollection(): Promise<void>;
    
    // Content type specific operations
    abstract indexBooks(bookIds: string[]): Promise<BatchIndexResult>;
    abstract indexAuthors(authorIds: string[]): Promise<BatchIndexResult>;
    abstract indexChapters(chapterIds: string[]): Promise<BatchIndexResult>;
    
    // Reindexing operations
    abstract reindexContent(contentId: string, contentType: ContentType): Promise<IndexResult>;
    abstract reindexAll(): Promise<BatchIndexResult>;
    
    // Utility operations
    abstract existsByContentId(contentId: string, contentType?: ContentType): Promise<boolean>;
    abstract countByContentType(contentType: ContentType): Promise<number>;
    abstract getDocumentsByContentType(contentType: ContentType, limit?: number): Promise<VectorDocument[]>;
}
