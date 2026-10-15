import type {
  CollectionStats,
  BatchIndexResult,
} from '@/modules/chroma/domain/repositories/vector.repository.interface';

export type IndexDocumentResult = {
  success: boolean;
  documentId?: string;
  error?: string;
};

export type { BatchIndexResult, CollectionStats };

export interface ReindexStatsResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface ReindexResult {
  success: boolean;
  details: { authors: ReindexStatsResult; books: ReindexStatsResult };
}

export interface ChatbotSourceResult {
  title: string;
  bookId?: string;
  bookSlug?: string;
  chapterTitle?: string;
  type: 'book' | 'chapter';
}

export interface AskChatbotResult {
  question: string;
  answer: string;
  sources: ChatbotSourceResult[];
}
