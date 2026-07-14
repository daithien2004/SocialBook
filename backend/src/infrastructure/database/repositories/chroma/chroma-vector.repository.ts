import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient, type Where, type Collection } from 'chromadb';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { Document } from '@langchain/core/documents';

import {
  IVectorRepository,
  SearchResult,
  BatchIndexResult,
  CollectionStats,
} from '@/domain/chroma/repositories/vector.repository.interface';
import { VectorDocument } from '@/domain/chroma/entities/vector-document.entity';
import { SearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { VectorId } from '@/domain/chroma/value-objects/vector-id.vo';
import { ContentType } from '@/domain/chroma/value-objects/content-type.vo';

type ContentTypeValue = 'book' | 'author' | 'chapter';

interface ChromaMetadata {
  id: string;
  contentId: string;
  contentType: ContentTypeValue;
  [key: string]: string | number | boolean;
}

@Injectable()
export class ChromaVectorRepository implements IVectorRepository, OnModuleInit {
  private readonly logger = new Logger(ChromaVectorRepository.name);
  private vectorStore: Chroma;
  private embeddings: HuggingFaceInferenceEmbeddings;
  private isInitialized = false;
  private chromaClient: ChromaClient;
  private collection: Collection;
  private readonly DEFAULT_SEARCH_LIMIT = 10;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      const hfKey = this.configService.get<string>('env.HUGGINGFACE_API_KEY');
      if (!hfKey) {
        this.logger.error(
          '❌ HUGGINGFACE_API_KEY is missing in configuration!',
        );
        return;
      }

      this.logger.log(
        `🔑 Using HuggingFace API Key: ${hfKey.substring(0, 5)}...${hfKey.substring(hfKey.length - 4)}`,
      );

      // model cho tiếng Việt
      this.embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: hfKey,
        model: 'keepitreal/vietnamese-sbert',
      });

      const chromaUrl = this.configService.get<string>(
        'env.CHROMA_URL',
        'http://localhost:8000',
      );
      const collectionName = this.configService.get<string>(
        'env.CHROMA_COLLECTION',
        'socialbook_vectors_v2',
      );

      this.logger.log(
        `🌐 Connecting to Chroma at: ${chromaUrl}, Collection: ${collectionName}`,
      );

      this.chromaClient = new ChromaClient({ path: chromaUrl });
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: collectionName,
        metadata: {
          'hnsw:space': 'cosine',
          'hnsw:M': 16, // 1 vector have 16 edge in graph
          'hnsw:search_ef': 50, // Reduce from 100 for faster search, slight recall trade-off
          'hnsw:construction_ef': 100,
        },
      });

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

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn(
        'Vector store not initialized. Attempting to reconnect to ChromaDB...',
      );
      await this.onModuleInit();
      if (!this.isInitialized) {
        throw new Error('Vector store not initialized');
      }
    }
  }

  // ─── Embedding ───────────────────────────────────

  async embedQuery(text: string): Promise<number[]> {
    await this.ensureInitialized();
    return this.embeddings.embedQuery(text);
  }

  // ─── Document Operations ─────────────────────────

  async save(document: VectorDocument): Promise<void> {
    await this.ensureInitialized();

    await this.vectorStore.addDocuments([this.toLangchainDocument(document)]);
  }

  async saveBatch(documents: VectorDocument[]): Promise<BatchIndexResult> {
    await this.ensureInitialized();

    if (documents.length === 0) {
      return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };
    }

    try {
      const langchainDocs = documents.map((doc) =>
        this.toLangchainDocument(doc),
      );
      await this.vectorStore.addDocuments(langchainDocs);

      return {
        totalProcessed: documents.length,
        successful: documents.length,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Batch save failed for ${documents.length} docs, attempting split-and-retry. Error: ${message}`,
      );

      // Granular Error Handling: Split and retry if batch is large
      if (documents.length > 1) {
        const mid = Math.floor(documents.length / 2);
        const leftHalf = documents.slice(0, mid);
        const rightHalf = documents.slice(mid);

        const [leftResult, rightResult] = await Promise.all([
          this.saveBatch(leftHalf),
          this.saveBatch(rightHalf),
        ]);

        return {
          totalProcessed:
            leftResult.totalProcessed + rightResult.totalProcessed,
          successful: leftResult.successful + rightResult.successful,
          failed: leftResult.failed + rightResult.failed,
          errors: [...leftResult.errors, ...rightResult.errors],
        };
      }

      // If single document failed, return it as failure
      return {
        totalProcessed: 1,
        successful: 0,
        failed: 1,
        errors: [{ contentId: documents[0].contentId, error: message }],
      };
    }
  }

  async findById(id: VectorId): Promise<VectorDocument | null> {
    await this.ensureInitialized();

    try {
      // ✅ Use direct ID lookup for better performance
      const result = await this.collection.get({
        ids: [id.toString()],
      });

      if (!result.ids || result.ids.length === 0) {
        return null;
      }

      return this.mapToVectorDocument(
        result.documents[0] as string,
        result.metadatas[0] as unknown as ChromaMetadata,
      );
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
    await this.ensureInitialized();

    try {
      const where: Record<string, string> = { contentId };
      if (contentType) {
        where.contentType = contentType.toString();
      }

      const result = await this.collection.get({ where, limit: 100 });

      return (result.documents || []).map((doc, index) => {
        const metadata = (result.metadatas?.[index] || {}) as ChromaMetadata;
        return VectorDocument.reconstitute({
          id: metadata.id || '',
          contentId: metadata.contentId || contentId,
          contentType: this.parseContentType(metadata.contentType),
          content: doc || '',
          metadata,
          embedding: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to find documents by content ID: ${contentId}`,
        error,
      );
      return [];
    }
  }

  async deleteById(id: VectorId): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.collection.delete({ where: { id: id.toString() } });
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
    await this.ensureInitialized();

    try {
      const where: Record<string, string> = { contentId };
      if (contentType) {
        where.contentType = contentType.toString();
      }

      await this.collection.delete({ where });
    } catch (error) {
      this.logger.error(
        `Failed to delete documents by content ID: ${contentId}`,
        error,
      );
      throw error;
    }
  }

  // ─── Search Operations ───────────────────────────

  async search(query: SearchQuery): Promise<SearchResult[]> {
    await this.ensureInitialized();

    try {
      const filter: Where = {};
      if (query.contentType) {
        filter.contentType = query.contentType.toString();
      }

      if (query.filters) {
        Object.assign(filter, query.filters);
      }

      const results = await this.vectorStore.similaritySearchWithScore(
        query.query,
        query.limit,
        Object.keys(filter).length > 0 ? filter : undefined,
      );

      this.logger.debug(
        `Raw search results for "${query.query}": ${results.length}`,
      );

      return results
        .map(([doc, distance]) => ({
          document: this.mapToVectorDocument(
            doc.pageContent,
            doc.metadata as ChromaMetadata,
          ),
          score: this.calculateSimilarityScore(distance),
        }))
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
    await this.ensureInitialized();

    try {
      const filter: Where = {};
      if (contentType) {
        filter.contentType = contentType.toString();
      }

      const results = await this.vectorStore.similaritySearchWithScore(
        content,
        limit || 10,
        Object.keys(filter).length > 0 ? filter : undefined,
      );

      return results.map(([doc, distance]) => ({
        document: this.mapToVectorDocument(
          doc.pageContent,
          doc.metadata as ChromaMetadata,
        ),
        score: this.calculateSimilarityScore(distance),
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
    await this.ensureInitialized();

    try {
      const document = await this.findById(documentId);
      if (!document) {
        return [];
      }

      const filter: Where = {
        contentType: document.contentType.toString(),
      };

      const results = await this.vectorStore.similaritySearchWithScore(
        document.content,
        limit || this.DEFAULT_SEARCH_LIMIT,
        filter,
      );

      return results
        .map(([doc, distance]) => ({
          document: this.mapToVectorDocument(
            doc.pageContent,
            doc.metadata as ChromaMetadata,
          ),
          score: this.calculateSimilarityScore(distance),
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

  // ─── Collection Operations ───────────────────────

  async clearCollection(): Promise<void> {
    await this.ensureInitialized();

    try {
      const collectionName = this.configService.get<string>(
        'env.CHROMA_COLLECTION',
        'socialbook_vectors_v2',
      );

      this.logger.log(`🗑️ Permanently deleting collection: ${collectionName}`);

      try {
        await this.chromaClient.deleteCollection({ name: collectionName });
      } catch (error) {
        this.logger.warn(
          `Failed to delete collection ${collectionName}`,
          error,
        );
      }

      this.collection = await this.chromaClient.createCollection({
        name: collectionName,
        metadata: {
          'hnsw:space': 'cosine',
          'hnsw:M': 16,
          'hnsw:search_ef': 50,
          'hnsw:construction_ef': 100,
        },
      });

      this.vectorStore = new Chroma(this.embeddings, {
        collectionName,
        url: this.configService.get<string>(
          'env.CHROMA_URL',
          'http://localhost:8000',
        ),
      });

      this.isInitialized = true;
      this.logger.log(`✅ Collection ${collectionName} has been recreated`);
    } catch (error) {
      this.logger.error('❌ Failed to clear collection:', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<CollectionStats> {
    await this.ensureInitialized();

    try {
      const count = await this.collection.count();
      return {
        totalDocuments: count,
        documentsByType: {},
        totalEmbeddings: count,
        collectionSize: count,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get collection stats', error);
      throw error;
    }
  }

  // ─── Content Type Specific Operations ─────────────
  // These are stubs — actual indexing is done by ReindexAllUseCase

  indexBooks(_bookIds: string[]): Promise<BatchIndexResult> {
    void _bookIds;
    throw new InternalServerErrorException(
      'Not implemented — use ReindexAllUseCase',
    );
  }

  indexAuthors(_authorIds: string[]): Promise<BatchIndexResult> {
    void _authorIds;
    throw new InternalServerErrorException(
      'Not implemented — use ReindexAllUseCase',
    );
  }

  indexChapters(_chapterIds: string[]): Promise<BatchIndexResult> {
    void _chapterIds;
    throw new InternalServerErrorException(
      'Not implemented — use ReindexAllUseCase',
    );
  }

  // ─── Private Helpers ─────────────────────────────

  /**
   * Unified mapping from Chroma raw data to VectorDocument domain entity.
   */
  private mapToVectorDocument(
    pageContent: string,
    metadata: ChromaMetadata,
  ): VectorDocument {
    const contentType = this.parseContentType(metadata?.contentType);
    return VectorDocument.reconstitute({
      id: metadata?.id || '',
      contentId: metadata?.contentId || '',
      contentType,
      content: pageContent || '',
      metadata: {
        title: metadata?.title || '',
        author: metadata?.author || '',
        genres: metadata?.genres || [],
        tags: metadata?.tags || [],
        timestamp: metadata?.timestamp || Date.now(),
        chunkIndex: metadata?.chunkIndex,
      },
      embedding: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private toLangchainDocument(doc: VectorDocument): Document {
    return new Document({
      pageContent: doc.content,
      metadata: {
        id: doc.id.toString(),
        contentId: doc.contentId,
        contentType: doc.contentType.toString(),
        ...doc.metadata,
      },
    });
  }

  private calculateSimilarityScore(distance: number): number {
    // Chroma with cosine space returns distance in [0, 2]: 0 = identical, 2 = opposite
    // Similarity = 1 - distance / 2
    const similarity = 1 - distance / 2;
    return Math.max(0, Math.min(1, similarity));
  }

  private parseContentType(value: string | undefined): ContentTypeValue {
    const valid: ContentTypeValue[] = ['book', 'author', 'chapter'];
    if (value && valid.includes(value as ContentTypeValue)) {
      return value as ContentTypeValue;
    }
    this.logger.warn(
      `⚠️ Unknown contentType: "${value}", defaulting to 'book'`,
    );
    return 'book';
  }
}
