import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AskChatbotResult,
  BatchIndexResult,
  IndexDocumentResult,
  ReindexResult,
} from '@/modules/chroma/application/chroma.result';
import type { CollectionStats } from '@/modules/chroma/domain/repositories/vector.repository.interface';

export class IndexDocumentResponseDto implements IndexDocumentResult {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  documentId?: string;

  @ApiPropertyOptional()
  error?: string;

  private constructor(result: IndexDocumentResult) {
    this.success = result.success;
    this.documentId = result.documentId;
    this.error = result.error;
  }

  static fromResult(result: IndexDocumentResult): IndexDocumentResponseDto {
    return new IndexDocumentResponseDto(result);
  }
}

export class BatchIndexErrorResponseDto {
  @ApiProperty()
  contentId: string;

  @ApiProperty()
  error: string;

  private constructor(contentId: string, error: string) {
    this.contentId = contentId;
    this.error = error;
  }

  static fromResult(error: { contentId: string; error: string }) {
    return new BatchIndexErrorResponseDto(error.contentId, error.error);
  }
}

export class BatchIndexResponseDto implements BatchIndexResult {
  @ApiProperty()
  totalProcessed: number;

  @ApiProperty()
  successful: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [BatchIndexErrorResponseDto] })
  errors: BatchIndexErrorResponseDto[];

  private constructor(result: BatchIndexResult) {
    this.totalProcessed = result.totalProcessed;
    this.successful = result.successful;
    this.failed = result.failed;
    this.errors = result.errors.map((error) =>
      BatchIndexErrorResponseDto.fromResult(error),
    );
  }

  static fromResult(result: BatchIndexResult): BatchIndexResponseDto {
    return new BatchIndexResponseDto(result);
  }
}

export class ReindexStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  successful: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [String] })
  errors: string[];

  private constructor(result: ReindexResult['details']['authors']) {
    this.total = result.total;
    this.successful = result.successful;
    this.failed = result.failed;
    this.errors = result.errors;
  }

  static fromResult(result: ReindexResult['details']['authors']) {
    return new ReindexStatsResponseDto(result);
  }
}

export class ReindexDetailsResponseDto {
  @ApiProperty({ type: ReindexStatsResponseDto })
  authors: ReindexStatsResponseDto;

  @ApiProperty({ type: ReindexStatsResponseDto })
  books: ReindexStatsResponseDto;

  private constructor(result: ReindexResult['details']) {
    this.authors = ReindexStatsResponseDto.fromResult(result.authors);
    this.books = ReindexStatsResponseDto.fromResult(result.books);
  }

  static fromResult(result: ReindexResult['details']) {
    return new ReindexDetailsResponseDto(result);
  }
}

export class ReindexResponseDto implements ReindexResult {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: ReindexDetailsResponseDto })
  details: ReindexDetailsResponseDto;

  private constructor(result: ReindexResult) {
    this.success = result.success;
    this.details = ReindexDetailsResponseDto.fromResult(result.details);
  }

  static fromResult(result: ReindexResult): ReindexResponseDto {
    return new ReindexResponseDto(result);
  }
}

export class ClearCollectionResponseDto {
  @ApiProperty()
  success: boolean;

  private constructor(success: boolean) {
    this.success = success;
  }

  static fromResult(result: { success: boolean }): ClearCollectionResponseDto {
    return new ClearCollectionResponseDto(result.success);
  }
}

export class CollectionStatsResponseDto implements CollectionStats {
  @ApiProperty()
  totalDocuments: number;

  @ApiProperty({ type: Object, additionalProperties: { type: 'integer' } })
  documentsByType: Record<string, number>;

  @ApiProperty()
  totalEmbeddings: number;

  @ApiProperty()
  collectionSize: number;

  @ApiProperty()
  lastUpdated: Date;

  private constructor(result: CollectionStats) {
    this.totalDocuments = result.totalDocuments;
    this.documentsByType = result.documentsByType;
    this.totalEmbeddings = result.totalEmbeddings;
    this.collectionSize = result.collectionSize;
    this.lastUpdated = result.lastUpdated;
  }

  static fromResult(result: CollectionStats): CollectionStatsResponseDto {
    return new CollectionStatsResponseDto(result);
  }
}

export class ChatbotSourceResponseDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  bookId?: string;

  @ApiPropertyOptional()
  bookSlug?: string;

  @ApiPropertyOptional()
  chapterTitle?: string;

  @ApiProperty({ enum: ['book', 'chapter'] })
  type: 'book' | 'chapter';

  private constructor(result: AskChatbotResult['sources'][number]) {
    this.title = result.title;
    this.bookId = result.bookId;
    this.bookSlug = result.bookSlug;
    this.chapterTitle = result.chapterTitle;
    this.type = result.type;
  }

  static fromResult(result: AskChatbotResult['sources'][number]) {
    return new ChatbotSourceResponseDto(result);
  }
}

export class AskChatbotResponseDto implements AskChatbotResult {
  @ApiProperty()
  question: string;

  @ApiProperty()
  answer: string;

  @ApiProperty({ type: [ChatbotSourceResponseDto] })
  sources: ChatbotSourceResponseDto[];

  private constructor(result: AskChatbotResult) {
    this.question = result.question;
    this.answer = result.answer;
    this.sources = result.sources.map((source) =>
      ChatbotSourceResponseDto.fromResult(source),
    );
  }

  static fromResult(result: AskChatbotResult): AskChatbotResponseDto {
    return new AskChatbotResponseDto(result);
  }
}
