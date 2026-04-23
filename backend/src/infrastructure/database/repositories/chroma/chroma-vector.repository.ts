import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient } from 'chromadb';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { Document } from '@langchain/core/documents';

import {
  IVectorRepository,
  SearchResult,
  IndexResult,
  BatchIndexResult,
  CollectionStats,
} from '@/domain/chroma/repositories/vector.repository.interface';
import { VectorDocument } from '@/domain/chroma/entities/vector-document.entity';
import { SearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { VectorId } from '@/domain/chroma/value-objects/vector-id.vo';
import { ContentType } from '@/domain/chroma/value-objects/content-type.vo';

@Injectable()
export class ChromaVectorRepository implements IVectorRepository, OnModuleInit {
  private readonly logger = new Logger(ChromaVectorRepository.name);
  private vectorStore: Chroma;
  private embeddings: HuggingFaceInferenceEmbeddings;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const hfKey = this.configService.get('env.HUGGINGFACE_API_KEY');
      if (!hfKey) {
        this.logger.error('❌ HUGGINGFACE_API_KEY is missing in configuration!');
      } else {
        this.logger.log(`🔑 Using HuggingFace API Key: ${hfKey.substring(0, 5)}...${hfKey.substring(hfKey.length - 4)}`);
      }

      this.embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: hfKey,
        model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      });

      const chromaUrl = this.configService.get('env.CHROMA_URL', 'http://localhost:8000');
      const collectionName = this.configService.get('env.CHROMA_COLLECTION', 'socialbook_vectors');
      
      this.logger.log(`🌐 Connecting to Chroma at: ${chromaUrl}, Collection: ${collectionName}`);

      this.vectorStore = new Chroma(this.embeddings, {
        collectionName,
        url: chromaUrl,
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

    // Diagnostic: Try to embed the content manually to see if it works
    try {
      const testEmbedding = await this.embeddings.embedQuery(document.content.substring(0, 50));
      if (!testEmbedding || testEmbedding.length === 0) {
        this.logger.error(`❌ Embedding generation returned empty for document: ${document.contentId}`);
      } else {
        this.logger.debug(`✅ Successfully generated embedding of length ${testEmbedding.length}`);
      }
    } catch (e) {
      this.logger.error(`❌ Error during manual embedding test: ${e.message}`);
    }

    const langchainDoc = new Document({
      pageContent: document.content,
      metadata: {
        id: document.id.toString(),
        contentId: document.contentId,
        contentType: document.contentType.toString(),
        ...document.metadata,
      },
    });

    await this.vectorStore.addDocuments([langchainDoc]);
  }

  async findById(id: VectorId): Promise<VectorDocument | null> {
    this.ensureInitialized();

    try {
      const results = await this.vectorStore.similaritySearchWithScore(
        `id:${id.toString()}`,
        1,
      );

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      return this.mapLangchainResultToDocument(result);
    } catch (error) {
      this.logger.error(
        `Failed to find document by ID: ${id.toString()}`,
        error,
      );
      return null;
    }
  }

  async findByContentId(
    contentId: string,
    contentType?: ContentType,
  ): Promise<VectorDocument[]> {
    this.ensureInitialized();

    try {
      const filter = contentType
        ? `contentId:${contentId} AND contentType:${contentType.toString()}`
        : `contentId:${contentId}`;

      const results = await this.vectorStore.similaritySearchWithScore(
        filter,
        100,
      );

      return results.map((result) => this.mapLangchainResultToDocument(result));
    } catch (error) {
      this.logger.error(
        `Failed to find documents by content ID: ${contentId}`,
        error,
      );
      return [];
    }
  }

  async deleteById(id: VectorId): Promise<void> {
    this.ensureInitialized();

    try {
      // Chroma doesn't have a direct delete by ID method
      // This would need to be implemented using Chroma's delete API
      this.logger.warn(
        `Delete by ID not implemented for Chroma: ${id.toString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete document by ID: ${id.toString()}`,
        error,
      );
      throw error;
    }
  }

  async deleteByContentId(
    contentId: string,
    contentType?: ContentType,
  ): Promise<void> {
    this.ensureInitialized();

    try {
      // Chroma doesn't have a direct delete method
      // This would need to be implemented using Chroma's delete API
      this.logger.warn(
        `Delete by content ID not implemented for Chroma: ${contentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete documents by content ID: ${contentId}`,
        error,
      );
      throw error;
    }
  }

  // Search operations
  async search(query: SearchQuery): Promise<SearchResult[]> {
    this.ensureInitialized();

    try {
      // Build metadata filter
      const filter: Record<string, any> = {};
      if (query.contentType) {
        filter.contentType = query.contentType.toString();
      }
      
      if (query.filters) {
        Object.assign(filter, query.filters);
      }

      // Perform search with score
      // Note: Chroma returns distance (L2 or Cosine), usually lower distance means higher similarity
      const results = await this.vectorStore.similaritySearchWithScore(
        query.query,
        query.limit,
        Object.keys(filter).length > 0 ? filter : undefined,
      );

      this.logger.debug(`Raw search results for "${query.query}": ${results.length}`);

      const queryKeywords = query.query.toLowerCase().split(/\s+/).filter(kw => kw.length > 0);

      return results
        .map(([doc, score]) => {
          let boost = 0;
          const contentLower = doc.pageContent.toLowerCase();
          const titleLower = (doc.metadata?.title as string || '').toLowerCase();
          
          for (const kw of queryKeywords) {
            if (titleLower.includes(kw)) {
              boost += 0.5;
            } else if (contentLower.includes(kw)) {
              boost += 0.5;
            }
          }

          const similarity = (1 / (1 + score)) + boost;

          this.logger.debug(`Result: ${doc.pageContent.substring(0, 40)} | Raw Distance: ${score.toFixed(4)} | Boosted Similarity: ${similarity.toFixed(4)}`);

          return {
            document: this.mapLangchainDocToDocument(doc),
            score: similarity,
          };
        })
        .filter((result) => result.score >= query.threshold)
        .sort((a, b) => b.score - a.score); 
    } catch (error) {
      this.logger.error(`Search failed for query: ${query.query}`, error);
      throw error;
    }
  }

  async searchByContent(
    content: string,
    contentType?: ContentType,
    limit?: number,
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    try {
      const results = await this.vectorStore.similaritySearch(
        content,
        limit || 10,
      );

      return results.map((doc, index) => ({
        document: this.mapLangchainDocToDocument(doc),
        score: 1.0 - index / results.length,
      }));
    } catch (error) {
      this.logger.error(`Content search failed for: ${content}`, error);
      throw error;
    }
  }

  async findSimilar(
    documentId: VectorId,
    limit?: number,
    threshold?: number,
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    try {
      const document = await this.findById(documentId);
      if (!document) {
        return [];
      }

      const results = await this.vectorStore.similaritySearch(
        document.content,
        limit || 10,
      );

      return results
        .map((doc, index) => ({
          document: this.mapLangchainDocToDocument(doc),
          score: 1.0 - index / results.length,
        }))
        .filter((result) => result.score >= (threshold || 0.7));
    } catch (error) {
      this.logger.error(
        `Similarity search failed for document: ${documentId.toString()}`,
        error,
      );
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
          error: error.message,
        });
        failed++;
      }
    }

    return {
      totalProcessed: documents.length,
      successful,
      failed,
      errors,
    };
  }

  async deleteBatch(ids: VectorId[]): Promise<BatchIndexResult> {
    this.ensureInitialized();

    // Chroma doesn't have batch delete implemented
    // This would need to be implemented using Chroma's delete API
    this.logger.warn(
      `Batch delete not implemented for ${ids.length} documents`,
    );

    return {
      totalProcessed: ids.length,
      successful: 0,
      failed: ids.length,
      errors: ids.map((id) => ({
        contentId: id.toString(),
        error: 'Delete not implemented',
      })),
    };
  }

  async deleteByContentType(contentType: ContentType): Promise<void> {
    this.ensureInitialized();

    try {
      // Chroma doesn't have delete by metadata implemented
      // This would need to be implemented using Chroma's delete API
      this.logger.warn(
        `Delete by content type not implemented for: ${contentType.toString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete by content type: ${contentType.toString()}`,
        error,
      );
      throw error;
    }
  }

  // Collection operations
  async clearCollection(): Promise<void> {
    this.ensureInitialized();

    try {
      const collectionName = this.configService.get('env.CHROMA_COLLECTION', 'socialbook_vectors');
      const chromaUrl = this.configService.get('env.CHROMA_URL', 'http://localhost:8000');
      
      this.logger.log(`🗑️ Permanently deleting collection: ${collectionName} at ${chromaUrl}`);
      
      const client = new ChromaClient({ path: chromaUrl });
      try {
        await client.deleteCollection({ name: collectionName });
      } catch (e) {
        this.logger.warn(`Collection ${collectionName} does not exist, skipping delete`);
      }
      
      await client.createCollection({
        name: collectionName,
        metadata: { 'hnsw:space': 'cosine' },
      });
      
      this.logger.log(`✅ Collection ${collectionName} has been recreated in Chroma server`);

      // Re-initialize to create a fresh collection with correct dimensions
      this.isInitialized = false;
      await this.onModuleInit();
    } catch (error) {
      this.logger.error('❌ Failed to clear collection:', error);
      // If the error is that the collection doesn't exist, we should still re-init
      this.isInitialized = false;
      await this.onModuleInit();
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
        lastUpdated: new Date(),
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
    this.logger.warn(
      `Book indexing not implemented in Chroma repository. Use external indexing service.`,
    );
    return {
      totalProcessed: bookIds.length,
      successful: 0,
      failed: bookIds.length,
      errors: bookIds.map((id) => ({
        contentId: id,
        error: 'Book indexing not implemented in Chroma repository',
      })),
    };
  }

  async indexAuthors(authorIds: string[]): Promise<BatchIndexResult> {
    this.logger.warn(
      `Author indexing not implemented in Chroma repository. Use external indexing service.`,
    );
    return {
      totalProcessed: authorIds.length,
      successful: 0,
      failed: authorIds.length,
      errors: authorIds.map((id) => ({
        contentId: id,
        error: 'Author indexing not implemented in Chroma repository',
      })),
    };
  }

  async indexChapters(chapterIds: string[]): Promise<BatchIndexResult> {
    this.logger.warn(
      `Chapter indexing not implemented in Chroma repository. Use external indexing service.`,
    );
    return {
      totalProcessed: chapterIds.length,
      successful: 0,
      failed: chapterIds.length,
      errors: chapterIds.map((id) => ({
        contentId: id,
        error: 'Chapter indexing not implemented in Chroma repository',
      })),
    };
  }

  // Reindexing operations
  async reindexContent(
    contentId: string,
    contentType: ContentType,
  ): Promise<IndexResult> {
    this.logger.warn(
      `Reindexing not implemented in Chroma repository. Use external indexing service.`,
    );
    return {
      success: false,
      error: 'Reindexing not implemented in Chroma repository',
    };
  }

  async reindexAll(): Promise<BatchIndexResult> {
    this.logger.warn(
      `Reindex all not implemented in Chroma repository. Use external indexing service.`,
    );
    return {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };
  }

  // Utility operations
  async existsByContentId(
    contentId: string,
    contentType?: ContentType,
  ): Promise<boolean> {
    const documents = await this.findByContentId(contentId, contentType);
    return documents.length > 0;
  }

  async countByContentType(contentType: ContentType): Promise<number> {
    const documents = await this.findByContentId('', contentType);
    return documents.length;
  }

  async getDocumentsByContentType(
    contentType: ContentType,
    limit?: number,
  ): Promise<VectorDocument[]> {
    this.ensureInitialized();

    try {
      const results = await this.vectorStore.similaritySearchWithScore(
        `contentType:${contentType.toString()}`,
        limit || 100,
      );

      return results.map((result) => this.mapLangchainResultToDocument(result));
    } catch (error) {
      this.logger.error(
        `Failed to get documents by content type: ${contentType.toString()}`,
        error,
      );
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
      updatedAt: new Date(), // Not available in Chroma results
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
      updatedAt: new Date(), // Not available in Chroma results
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
