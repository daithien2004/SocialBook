import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient, type CollectionMetadata } from 'chromadb';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { Agent } from 'undici';

@Injectable()
export class ChromaConnectionFactory implements OnModuleDestroy {
  private readonly fetchDispatcher: Agent;

  constructor(private readonly config: ConfigService) {
    this.fetchDispatcher = new Agent({
      connectTimeout: this.config.get<number>(
        'env.CHROMA_CONNECT_TIMEOUT_MS',
        10_000,
      ),
      headersTimeout: this.config.get<number>(
        'env.CHROMA_HEADERS_TIMEOUT_MS',
        15_000,
      ),
      bodyTimeout: this.config.get<number>(
        'env.CHROMA_BODY_TIMEOUT_MS',
        30_000,
      ),
    });
  }

  private get dispatcherOptions(): RequestInit {
    const options: RequestInit & { dispatcher: Agent } = {
      dispatcher: this.fetchDispatcher,
    };
    return options;
  }

  private readonly DEFAULT_COLLECTION_METADATA = {
    'hnsw:space': 'cosine',
    'hnsw:M': 16, // 1 vector have 16 edge in graph
    'hnsw:search_ef': 50, // Reduce from 100 for faster search, slight recall trade-off
    'hnsw:construction_ef': 100,
  };

  getCollectionName(): string {
    return this.config.get<string>(
      'env.CHROMA_COLLECTION',
      'socialbook_vectors_v3',
    );
  }

  getChromaUrl(): string {
    return this.config.get<string>('env.CHROMA_URL', 'http://localhost:8000');
  }

  getHuggingFaceApiKey(): string | undefined {
    return this.config.get<string>('env.HUGGINGFACE_API_KEY');
  }

  getCollectionMetadata(): CollectionMetadata {
    return { ...this.DEFAULT_COLLECTION_METADATA };
  }

  createEmbeddings(): HuggingFaceInferenceEmbeddings {
    return new HuggingFaceInferenceEmbeddings({
      apiKey: this.getHuggingFaceApiKey(),
      model: 'keepitreal/vietnamese-sbert',
    });
  }

  createChromaClient(): ChromaClient {
    return new ChromaClient({
      path: this.getChromaUrl(),
      fetchOptions: this.dispatcherOptions,
    });
  }

  createVectorStore(
    embeddings: HuggingFaceInferenceEmbeddings,
    collectionName: string,
  ): Chroma {
    return new Chroma(embeddings, {
      collectionName,
      url: this.getChromaUrl(),
      clientParams: {
        fetchOptions: this.dispatcherOptions,
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.fetchDispatcher.close();
  }
}
