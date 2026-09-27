---
name: chromadb-vector-search
description: ChromaDB vector search with Clean Architecture. Covers IVectorRepository abstraction, LangChain vector stores, HuggingFace embeddings, similarity search, batch indexing with split-and-retry, and use-cases for AI features. Triggers on tasks involving ChromaDB, vector search, embeddings, LangChain, semantic search, or AI chatbot features.
---

# ChromaDB Vector Search

## Overview

This project uses **ChromaDB** for vector embeddings and semantic search, integrated with **LangChain** and **HuggingFace embeddings** (Vietnamese-optimized). The vector store follows Clean Architecture with `IVectorRepository` in the domain layer and `ChromaVectorRepository` in infrastructure.

## Trigger

Activate when working on:
- Vector search and semantic retrieval
- ChromaDB collections and embeddings
- `IVectorRepository` interface (`domain/chroma/repositories/`)
- `ChromaVectorRepository` implementation (`infrastructure/database/repositories/chroma/`)
- Chroma use cases (index-document, search, ask-chatbot, batch-index, reindex-all, clear-collection, get-collection-stats)
- AI/chatbot features (`ask-chatbot`)
- Content indexing (books, authors, chapters)

## Architecture

```
domain/chroma/
├── entities/
│   ├── search-query.entity.ts      # Query with type, filters, threshold, limit
│   └── vector-document.entity.ts   # Domain vector document
├── repositories/
│   └── vector.repository.interface.ts  # IVectorRepository abstract class
└── value-objects/
    ├── content-type.vo.ts          # 'book' | 'author' | 'chapter'
    ├── embedding-vector.vo.ts      # Typed embedding array
    └── vector-id.vo.ts             # Typed identifier

application/chroma/
├── chroma-application.module.ts     # Module setup
├── listeners/
│   └── book-vector-index.listener.ts  # Auto-index on book events
├── processors/
│   └── chroma.processor.ts           # Background indexing jobs
└── use-cases/
    ├── ask-chatbot/                   # Ask chatbot feature
    ├── batch-index/                   # Batch index documents
    ├── clear-collection/              # Clear and recreate collection
    ├── get-collection-stats/          # Collection statistics
    ├── index-document/                # Single document indexing
    ├── reindex-all/                   # Full reindexing
    └── search/                        # Semantic search

infrastructure/database/repositories/chroma/
├── chroma-connection.factory.ts       # Factory for Chroma/LangChain clients
└── chroma-vector.repository.ts        # IVectorRepository implementation

presentation/chroma/
├── chroma.controller.ts               # REST endpoints for vector ops
└── dto/
    ├── index-document.dto.ts
    └── search-query.dto.ts
```

## Domain Layer: IVectorRepository

```typescript
// backend/src/domain/chroma/repositories/vector.repository.interface.ts

// Return types
interface SearchResult { document: VectorDocument; score: number; }
interface IndexResult { success: boolean; documentId?: string; error?: string; }
interface BatchIndexResult { totalProcessed: number; successful: number; failed: number; errors: Array<{ contentId: string; error: string }>; }
interface CollectionStats { totalDocuments: number; documentsByType: Record<string, number>; totalEmbeddings: number; collectionSize: number; lastUpdated: Date; }

export abstract class IVectorRepository {
  // Document operations
  abstract save(document: VectorDocument): Promise<void>;
  abstract saveBatch(documents: VectorDocument[]): Promise<BatchIndexResult>;
  abstract findById(id: VectorId): Promise<VectorDocument | null>;
  abstract findByContentId(contentId: string, contentType?: ContentType): Promise<VectorDocument[]>;
  abstract deleteById(id: VectorId): Promise<void>;
  abstract deleteByContentId(contentId: string, contentType?: ContentType): Promise<void>;

  // Embedding
  abstract embedQuery(text: string): Promise<number[]>;

  // Search
  abstract search(query: SearchQuery): Promise<SearchResult[]>;
  abstract searchByContent(content: string, contentType?: ContentType, limit?: number): Promise<SearchResult[]>;
  abstract findSimilar(documentId: VectorId, limit?: number, threshold?: number): Promise<SearchResult[]>;

  // Collection management
  abstract clearCollection(): Promise<void>;
  abstract getCollectionStats(): Promise<CollectionStats>;

  // Content type-specific operations
  abstract indexBooks(bookIds: string[]): Promise<BatchIndexResult>;
  abstract indexAuthors(authorIds: string[]): Promise<BatchIndexResult>;
  abstract indexChapters(chapterIds: string[]): Promise<BatchIndexResult>;
}
```

## Infrastructure: ChromaVectorRepository

```typescript
// Use LangChain's Chroma vector store + HuggingFace embeddings
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient, type Where, type Collection } from 'chromadb';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

@Injectable()
export class ChromaVectorRepository implements IVectorRepository, OnModuleInit {
  private vectorStore: Chroma;
  private embeddings: HuggingFaceInferenceEmbeddings;
  private chromaClient: ChromaClient;
  private collection: Collection;
  private isInitialized = false;
  private readonly DEFAULT_SEARCH_LIMIT = 10;
  private readonly logger = new Logger(ChromaVectorRepository.name);

  constructor(
    private readonly chromaConnectionFactory: ChromaConnectionFactory,
  ) {}

  async onModuleInit(): Promise<void> {
    // 1. Get config from factory
    this.embeddings = this.chromaConnectionFactory.createEmbeddings();
    const chromaUrl = this.chromaConnectionFactory.getChromaUrl();
    const collectionName = this.chromaConnectionFactory.getCollectionName();

    // 2. Create Chroma native client + collection
    this.chromaClient = this.chromaConnectionFactory.createChromaClient();
    this.collection = await this.chromaClient.getOrCreateCollection({
      name: collectionName,
      metadata: this.chromaConnectionFactory.getCollectionMetadata(),
    });

    // 3. Create LangChain vector store wrapper
    this.vectorStore = this.chromaConnectionFactory.createVectorStore(
      this.embeddings, collectionName,
    );

    this.isInitialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Vector store not initialized. Attempting reconnect...');
      await this.onModuleInit();
      if (!this.isInitialized) throw new Error('Vector store not initialized');
    }
  }
  // ...
}
```

### Key Implementation Patterns

#### 1. `ensureInitialized()` Guard

Every public method calls `ensureInitialized()` before proceeding. If the store is down, it attempts a reconnect instead of crashing:

```typescript
async search(query: SearchQuery): Promise<SearchResult[]> {
  await this.ensureInitialized();
  // ... proceed with search
}
```

#### 2. Search with Threshold & Score

Chroma returns raw distances; convert to a [0, 1] similarity score:

```typescript
async search(query: SearchQuery): Promise<SearchResult[]> {
  await this.ensureInitialized();
  try {
    const filter: Where = {};
    if (query.contentType) filter.contentType = query.contentType.toString();
    if (query.filters) Object.assign(filter, query.filters);

    const results = await this.vectorStore.similaritySearchWithScore(
      query.query,
      query.limit,
      Object.keys(filter).length > 0 ? filter : undefined,
    );

    return results
      .map(([doc, distance]) => ({
        document: this.mapToVectorDocument(doc.pageContent, doc.metadata as ChromaMetadata),
        score: this.calculateSimilarityScore(distance),  // 1 - distance / 2
      }))
      .filter(result => result.score >= query.threshold)
      .sort((a, b) => b.score - a.score);
  } catch (error) {
    this.logger.error(`Search failed: ${query.query}`, error);
    throw error;
  }
}

private calculateSimilarityScore(distance: number): number {
  // Chroma cosine distance: 0 = identical, 2 = opposite
  return Math.max(0, Math.min(1, 1 - distance / 2));
}
```

#### 3. Batch Save with Split-and-Retry

For large batches, if ChromaDB rejects the batch, split it recursively:

```typescript
async saveBatch(documents: VectorDocument[]): Promise<BatchIndexResult> {
  await this.ensureInitialized();
  if (documents.length === 0) return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };

  try {
    const langchainDocs = documents.map(doc => this.toLangchainDocument(doc));
    await this.vectorStore.addDocuments(langchainDocs);
    return { totalProcessed: documents.length, successful: documents.length, failed: 0, errors: [] };
  } catch (error) {
    // Split-and-retry for large batches
    if (documents.length > 1) {
      const mid = Math.floor(documents.length / 2);
      const [left, right] = await Promise.all([
        this.saveBatch(documents.slice(0, mid)),
        this.saveBatch(documents.slice(mid)),
      ]);
      return {
        totalProcessed: left.totalProcessed + right.totalProcessed,
        successful: left.successful + right.successful,
        failed: left.failed + right.failed,
        errors: [...left.errors, ...right.errors],
      };
    }
    // Single document failure
    return { totalProcessed: 1, successful: 0, failed: 1, errors: [{ contentId: documents[0].contentId, error: (error as Error).message }] };
  }
}
```

#### 4. `findById` via Native `collection.get()`

For ID lookups, bypass LangChain and use the native Chroma client directly:

```typescript
async findById(id: VectorId): Promise<VectorDocument | null> {
  await this.ensureInitialized();
  try {
    const result = await this.collection.get({ ids: [id.toString()] });
    if (!result.ids?.length) return null;
    return this.mapToVectorDocument(result.documents[0] as string, result.metadatas[0] as ChromaMetadata);
  } catch (error) {
    this.logger.error(`Find by ID ${id.toString()} failed`, error);
    return null;  // Fail safe: return null on Chroma errors
  }
}
```

#### 5. `toLangchainDocument` / `mapToVectorDocument` Conversion

```typescript
private toLangchainDocument(doc: VectorDocument): Document {
  return new Document({
    pageContent: doc.content,
    metadata: { id: doc.id.toString(), contentId: doc.contentId, contentType: doc.contentType.toString(), ...doc.metadata },
  });
}

private mapToVectorDocument(pageContent: string, metadata: ChromaMetadata): VectorDocument {
  return VectorDocument.reconstitute({
    id: metadata.id || '',
    contentId: metadata.contentId || '',
    contentType: this.parseContentType(metadata.contentType),
    content: pageContent || '',
    metadata: { title: metadata.title || '', author: metadata.author || '', genres: metadata.genres || [], tags: metadata.tags || [], timestamp: metadata.timestamp || Date.now(), chunkIndex: metadata.chunkIndex },
    embedding: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
```

## Use Case Pattern: IndexDocument

```typescript
// backend/src/application/chroma/use-cases/index-document/index-document.use-case.ts
@Injectable()
export class IndexDocumentUseCase {
  constructor(
    @Inject(IVectorRepository)
    private readonly vectorRepository: IVectorRepository,
  ) {}

  async execute(command: IndexDocumentCommand): Promise<IndexResult> {
    const { contentId, contentType, content, metadata } = command;

    // 1. Remove old entries for this content
    await this.vectorRepository.deleteByContentId(contentId, contentType);

    // 2. Create & save the document
    const document = VectorDocument.create({
      id: crypto.randomUUID(),
      contentId,
      contentType,
      content,
      metadata,
    });
    await this.vectorRepository.save(document);

    return { success: true, documentId: document.id.toString() };
  }
}
```

## Use Case Pattern: Search

```typescript
// backend/src/application/chroma/use-cases/search/search.use-case.ts
@Injectable()
export class SearchUseCase {
  constructor(
    @Inject(IVectorRepository)
    private readonly vectorRepository: IVectorRepository,
  ) {}

  async execute(query: SearchQuery): Promise<SearchResult[]> {
    const searchQuery = SearchQuery.create({
      query: query.query,
      contentType: query.contentType,
      limit: query.limit || 10,
      threshold: query.threshold || 0.7,
      filters: query.filters,
    });
    return this.vectorRepository.search(searchQuery);
  }
}
```

## Environment & Configuration

ChromaDB runs via Docker Compose alongside MongoDB, Redis, and Nginx. Configured through `ChromaConnectionFactory`:

| Variable | Description |
|----------|-------------|
| `CHROMA_URL` | ChromaDB HTTP endpoint (default: `http://localhost:8000`) |
| `CHROMA_COLLECTION_NAME` | Collection name for vector documents |
| `HUGGINGFACE_API_KEY` | HuggingFace inference API key for embeddings |

## Error Handling

1. **Graceful degradation on init failure**: `onModuleInit` catches all errors, sets `isInitialized = false`, and allows the server to continue running without vector search.
2. **`ensureInitialized()` retry**: Each operation retries initialization if was previously down — self-healing after transient failures.
3. **`findById` returns `null`** instead of throwing on Chroma errors: the caller handles missing documents gracefully.
4. **Batch indexing never partially fails**: Split-and-retry ensures maximal success; individual failures are recorded alongside successful counts.
5. **Score clamp**: `calculateSimilarityScore` bounds to [0, 1] to prevent edge-case NaN/Infinity.

## Testing

```typescript
// Unit test use cases with mocked IVectorRepository
const mockRepo = { search: jest.fn(), save: jest.fn() };
const useCase = new SearchUseCase(mockRepo as any);
await useCase.execute(query);
expect(mockRepo.search).toHaveBeenCalledWith(expect.objectContaining({ query: 'test' }));

// Test score calculation: Chroma distance 0.5 → similarity 0.75
// Test threshold filter: documents below query.threshold are excluded
```