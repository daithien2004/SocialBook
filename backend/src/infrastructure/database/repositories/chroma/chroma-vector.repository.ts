import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';

import { IVectorRepository, SearchResult, IndexResult, BatchIndexResult, CollectionStats } from '@/domain/chroma/repositories/vector.repository.interface';
import { VectorDocument } from '@/domain/chroma/entities/vector-document.entity';
import { SearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { VectorId } from '@/domain/chroma/value-objects/vector-id.vo';
import { ContentType } from '@/domain/chroma/value-objects/content-type.vo';

@Injectable()
export class ChromaVectorRepository implements IVectorRepository, OnModuleInit {
    private readonly logger = new Logger(ChromaVectorRepository.name);
    private vectorStore: Chroma;
    private embeddings: GoogleGenerativeAIEmbeddings;
    private isInitialized = false;

    constructor(private configService: ConfigService) {}

    async onModuleInit() {
        try {
            this.embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: this.configService.get('GOOGLE_API_KEY'),
                model: 'text-embedding-004',
            });

            this.vectorStore = new Chroma(this.embeddings, {
                collectionName: this.configService.get('CHROMA_COLLECTION', 'socialbook_vectors'),
                url: this.configService.get('CHROMA_URL', 'http://localhost:8000'),
            });

            this.isInitialized = true;
            this.logger.log('✅ Chroma vector store initialized successfully');
        } catch (error) {
            this.logger.error('❌ Failed to initialize Chroma:', error);
            this.isInitialized = false;
        }
    }

    private ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Vector store not initialized');
        }
    }

    // Document operations
    async save(document: VectorDocument): Promise<void> {
        this.ensureInitialized();
        
        const langchainDoc = new Document({
            pageContent: document.content,
            metadata: {
                id: document.id.toString(),
                contentId: document.contentId,
                contentType: document.contentType.toString(),
                ...document.metadata
            }
        });

        await this.vectorStore.addDocuments([langchainDoc]);
    }

    async findById(id: VectorId): Promise<VectorDocument | null> {
        this.ensureInitialized();
        
        try {
            const results = await this.vectorStore.similaritySearchWithScore(
                `id:${id.toString()}`, 
                1
            );

            if (results.length === 0) {
                return null;
            }

            const result = results[0];
            return this.mapLangchainResultToDocument(result);
        } catch (error) {
            this.logger.error(`Failed to find document by ID: ${id.toString()}`, error);
            return null;
        }
    }

    async findByContentId(contentId: string, contentType?: ContentType): Promise<VectorDocument[]> {
        this.ensureInitialized();
        
        try {
            const filter = contentType 
                ? `contentId:${contentId} AND contentType:${contentType.toString()}`
                : `contentId:${contentId}`;
                
            const results = await this.vectorStore.similaritySearchWithScore(filter, 100);
            
            return results.map(result => this.mapLangchainResultToDocument(result));
        } catch (error) {
            this.logger.error(`Failed to find documents by content ID: ${contentId}`, error);
            return [];
        }
    }

    async deleteById(id: VectorId): Promise<void> {
        this.ensureInitialized();
        
        try {
            // Chroma doesn't have a direct delete by ID method
            // This would need to be implemented using Chroma's delete API
            this.logger.warn(`Delete by ID not implemented for Chroma: ${id.toString()}`);
        } catch (error) {
            this.logger.error(`Failed to delete document by ID: ${id.toString()}`, error);
            throw error;
        }
    }

    async deleteByContentId(contentId: string, contentType?: ContentType): Promise<void> {
        this.ensureInitialized();
        
        try {
            // Chroma doesn't have a direct delete method
            // This would need to be implemented using Chroma's delete API
            this.logger.warn(`Delete by content ID not implemented for Chroma: ${contentId}`);
        } catch (error) {
            this.logger.error(`Failed to delete documents by content ID: ${contentId}`, error);
            throw error;
        }
    }

    // Search operations
    async search(query: SearchQuery): Promise<SearchResult[]> {
        this.ensureInitialized();
        
        try {
            const results = await this.vectorStore.similaritySearch(
                query.query,
                query.limit
            );

            return results
                .map((doc, index) => ({
                    document: this.mapLangchainDocToDocument(doc),
                    score: 1.0 - (index / results.length) // Simple scoring based on position
                }))
                .filter(result => result.score >= query.threshold);
        } catch (error) {
            this.logger.error(`Search failed for query: ${query.query}`, error);
            throw error;
        }
    }

    async searchByContent(content: string, contentType?: ContentType, limit?: number): Promise<SearchResult[]> {
        this.ensureInitialized();
        
        try {
            const results = await this.vectorStore.similaritySearch(content, limit || 10);

            return results
                .map((doc, index) => ({
                    document: this.mapLangchainDocToDocument(doc),
                    score: 1.0 - (index / results.length)
                }));
        } catch (error) {
            this.logger.error(`Content search failed for: ${content}`, error);
            throw error;
        }
    }

    async findSimilar(documentId: VectorId, limit?: number, threshold?: number): Promise<SearchResult[]> {
        this.ensureInitialized();
        
        try {
            const document = await this.findById(documentId);
            if (!document) {
                return [];
            }

            const results = await this.vectorStore.similaritySearch(
                document.content,
                limit || 10
            );

            return results
                .map((doc, index) => ({
                    document: this.mapLangchainDocToDocument(doc),
                    score: 1.0 - (index / results.length)
                }))
                .filter(result => result.score >= (threshold || 0.7));
        } catch (error) {
            this.logger.error(`Similarity search failed for document: ${documentId.toString()}`, error);
            throw error;
        }
    }

    // Batch operations
    async saveBatch(documents: VectorDocument[]): Promise<BatchIndexResult> {
        this.ensureInitialized();
        
        const errors: Array<{ contentId: string; error: string }> = [];
        let successful = 0;
        let failed = 0;

        for (const document of documents) {
            try {
                await this.save(document);
                successful++;
            } catch (error) {
                errors.push({
                    contentId: document.contentId,
                    error: error.message
                });
                failed++;
            }
        }

        return {
            totalProcessed: documents.length,
            successful,
            failed,
            errors
        };
    }

    async deleteBatch(ids: VectorId[]): Promise<BatchIndexResult> {
        this.ensureInitialized();
        
        // Chroma doesn't have batch delete implemented
        // This would need to be implemented using Chroma's delete API
        this.logger.warn(`Batch delete not implemented for ${ids.length} documents`);
        
        return {
            totalProcessed: ids.length,
            successful: 0,
            failed: ids.length,
            errors: ids.map(id => ({
                contentId: id.toString(),
                error: 'Delete not implemented'
            }))
        };
    }

    async deleteByContentType(contentType: ContentType): Promise<void> {
        this.ensureInitialized();
        
        try {
            // Chroma doesn't have delete by metadata implemented
            // This would need to be implemented using Chroma's delete API
            this.logger.warn(`Delete by content type not implemented for: ${contentType.toString()}`);
        } catch (error) {
            this.logger.error(`Failed to delete by content type: ${contentType.toString()}`, error);
            throw error;
        }
    }

    // Collection operations
    async clearCollection(): Promise<void> {
        this.ensureInitialized();
        
        try {
            // This would need to be implemented using Chroma's delete collection API
            this.logger.warn('Clear collection not implemented for Chroma');
        } catch (error) {
            this.logger.error('Failed to clear collection', error);
            throw error;
        }
    }

    async getCollectionStats(): Promise<CollectionStats> {
        this.ensureInitialized();
        
        try {
            // This would need to be implemented using Chroma's get collection API
            this.logger.warn('Collection stats not fully implemented for Chroma');
            
            return {
                totalDocuments: 0,
                documentsByType: {},
                totalEmbeddings: 0,
                collectionSize: 0,
                lastUpdated: new Date()
            };
        } catch (error) {
            this.logger.error('Failed to get collection stats', error);
            throw error;
        }
    }

    async optimizeCollection(): Promise<void> {
        this.ensureInitialized();
        
        try {
            // Chroma handles optimization automatically
            this.logger.log('Collection optimization completed');
        } catch (error) {
            this.logger.error('Failed to optimize collection', error);
            throw error;
        }
    }

    // Content type specific operations
    async indexBooks(bookIds: string[]): Promise<BatchIndexResult> {
        this.logger.warn(`Book indexing not implemented in Chroma repository. Use external indexing service.`);
        return {
            totalProcessed: bookIds.length,
            successful: 0,
            failed: bookIds.length,
            errors: bookIds.map(id => ({
                contentId: id,
                error: 'Book indexing not implemented in Chroma repository'
            }))
        };
    }

    async indexAuthors(authorIds: string[]): Promise<BatchIndexResult> {
        this.logger.warn(`Author indexing not implemented in Chroma repository. Use external indexing service.`);
        return {
            totalProcessed: authorIds.length,
            successful: 0,
            failed: authorIds.length,
            errors: authorIds.map(id => ({
                contentId: id,
                error: 'Author indexing not implemented in Chroma repository'
            }))
        };
    }

    async indexChapters(chapterIds: string[]): Promise<BatchIndexResult> {
        this.logger.warn(`Chapter indexing not implemented in Chroma repository. Use external indexing service.`);
        return {
            totalProcessed: chapterIds.length,
            successful: 0,
            failed: chapterIds.length,
            errors: chapterIds.map(id => ({
                contentId: id,
                error: 'Chapter indexing not implemented in Chroma repository'
            }))
        };
    }

    // Reindexing operations
    async reindexContent(contentId: string, contentType: ContentType): Promise<IndexResult> {
        this.logger.warn(`Reindexing not implemented in Chroma repository. Use external indexing service.`);
        return {
            success: false,
            error: 'Reindexing not implemented in Chroma repository'
        };
    }

    async reindexAll(): Promise<BatchIndexResult> {
        this.logger.warn(`Reindex all not implemented in Chroma repository. Use external indexing service.`);
        return {
            totalProcessed: 0,
            successful: 0,
            failed: 0,
            errors: []
        };
    }

    // Utility operations
    async existsByContentId(contentId: string, contentType?: ContentType): Promise<boolean> {
        const documents = await this.findByContentId(contentId, contentType);
        return documents.length > 0;
    }

    async countByContentType(contentType: ContentType): Promise<number> {
        const documents = await this.findByContentId('', contentType);
        return documents.length;
    }

    async getDocumentsByContentType(contentType: ContentType, limit?: number): Promise<VectorDocument[]> {
        this.ensureInitialized();
        
        try {
            const results = await this.vectorStore.similaritySearchWithScore(
                `contentType:${contentType.toString()}`,
                limit || 100
            );
            
            return results.map(result => this.mapLangchainResultToDocument(result));
        } catch (error) {
            this.logger.error(`Failed to get documents by content type: ${contentType.toString()}`, error);
            return [];
        }
    }

    private mapLangchainDocToDocument(doc: any): VectorDocument {
        const metadata = doc.metadata || {};
        
        return VectorDocument.reconstitute({
            id: metadata.id || this.generateId(),
            contentId: metadata.contentId || '',
            contentType: metadata.contentType || 'book',
            content: doc.pageContent,
            metadata: metadata,
            embedding: [], // Embedding not available in search results
            createdAt: new Date(), // Not available in Chroma results
            updatedAt: new Date()  // Not available in Chroma results
        });
    }

    private mapLangchainResultToDocument(result: any): VectorDocument {
        const metadata = result.metadata || {};
        
        return VectorDocument.reconstitute({
            id: metadata.id || this.generateId(),
            contentId: metadata.contentId || '',
            contentType: metadata.contentType || 'book',
            content: result.pageContent,
            metadata: metadata,
            embedding: [], // Embedding not available in search results
            createdAt: new Date(), // Not available in Chroma results
            updatedAt: new Date()  // Not available in Chroma results
        });
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}

