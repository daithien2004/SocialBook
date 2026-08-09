import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient, type CollectionMetadata } from 'chromadb';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

@Injectable()
export class ChromaConnectionFactory {
  private readonly DEFAULT_COLLECTION_METADATA = {
    'hnsw:space': 'cosine',
    'hnsw:M': 16, // 1 vector have 16 edge in graph
    'hnsw:search_ef': 50, // Reduce from 100 for faster search, slight recall trade-off
    'hnsw:construction_ef': 100,
  };

  constructor(private readonly config: ConfigService) {}

  getCollectionName(): string {
    return this.config.get<string>(
      'env.CHROMA_COLLECTION',
      'socialbook_vectors_v2',
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
    });
  }

  createVectorStore(
    embeddings: HuggingFaceInferenceEmbeddings,
    collectionName: string,
  ): Chroma {
    return new Chroma(embeddings, {
      collectionName,
      url: this.getChromaUrl(),
    });
  }
}
