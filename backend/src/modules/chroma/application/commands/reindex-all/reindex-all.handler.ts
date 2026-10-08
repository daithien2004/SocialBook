import { ReindexAllCommand } from './reindex-all.command';
import { CommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { Logger } from '@nestjs/common';
import { IAuthorRepository } from '@/modules/authors/domain/public-api';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { VectorDocument } from '@/modules/chroma/domain/entities/vector-document.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

interface IndexStats {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface ReindexResult {
  success: boolean;
  details: { authors: IndexStats; books: IndexStats };
}

@CommandHandler(ReindexAllCommand)
export class ReindexAllHandler {
  private readonly logger = new Logger(ReindexAllHandler.name);
  private readonly BATCH_THRESHOLD = 500;
  private readonly PAGE_LIMIT = 100;
  private readonly MAX_ERRORS_IN_STATS = 100;

  constructor(
    private readonly authorRepository: IAuthorRepository,
    private readonly bookRepository: IBookRepository,
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(): Promise<ReindexResult> {
    try {
      this.logger.log('ðŸš€ Starting full reindexing process...');

      // 1. Clear existing collection
      // LÆ°u Ã½: Hiá»‡n táº¡i Repository chÆ°a há»— trá»£ cÆ¡ cháº¿ Swap Collection (Blue-Green).
      // ChÃºng ta cháº¥p nháº­n rá»§i ro downtime ngáº¯n trong lÃºc reindex.
      await this.vectorRepository.clearCollection();
      this.logger.log('ðŸ—‘ï¸ Vector collection cleared.');

      // 2. Run Reindexing in Parallel for performance
      this.logger.log('âš¡ Running Author and Book reindexing in parallel...');
      const [authorStats, bookStats] = await Promise.all([
        this.reindexAuthors(),
        this.reindexBooks(),
      ]);

      this.logger.log('âœ¨ Full reindexing process completed!');

      return {
        success: true,
        details: { authors: authorStats, books: bookStats },
      };
    } catch (error: unknown) {
      this.logger.error('âŒ Full reindexing failed:', error);
      throw error;
    }
  }

  private async reindexAuthors(): Promise<IndexStats> {
    const stats: IndexStats = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };
    let currentPage = 1;
    let totalPages = 1;
    let batchBuffer: VectorDocument[] = [];
    const failedEntityIds = new Set<string>();

    this.logger.log('ðŸ“š Starting author reindexing...');

    do {
      const result = await this.authorRepository.findAll(
        {},
        { page: currentPage, limit: this.PAGE_LIMIT },
      );
      const authors = result.data;
      totalPages = result.meta.totalPages;

      if (currentPage === 1) {
        stats.total = result.meta.total;
        this.logger.log(
          `ðŸ“š Total authors: ${stats.total} (${totalPages} pages)`,
        );
      }

      for (const author of authors) {
        try {
          const bioClean = this.stripHtml(author.bio);
          const content = `TÃ¡c giáº£: ${author.name.toString()}\nTiá»ƒu sá»­: ${bioClean}`;

          const document = VectorDocument.createAuthorDocument(
            this.idGenerator.generate(),
            author.id.toString(),
            content,
            { name: author.name.toString(), type: 'author' },
            [],
          );
          batchBuffer.push(document);

          if (batchBuffer.length >= this.BATCH_THRESHOLD) {
            await this.flushBatch(batchBuffer, failedEntityIds, stats.errors);
            batchBuffer = [];
          }
        } catch (error: unknown) {
          failedEntityIds.add(author.id.toString());
          this.addError(
            stats.errors,
            `Author ${String(author.id)}: ${getErrorMessage(error)}`,
          );
        }
      }
      currentPage++;
    } while (currentPage <= totalPages);

    if (batchBuffer.length > 0) {
      await this.flushBatch(batchBuffer, failedEntityIds, stats.errors);
    }

    stats.failed = failedEntityIds.size;
    stats.successful = stats.total - stats.failed;
    return stats;
  }

  private async reindexBooks(): Promise<IndexStats> {
    const stats: IndexStats = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };
    let currentPage = 1;
    let totalPages = 1;
    let batchBuffer: VectorDocument[] = [];
    const failedEntityIds = new Set<string>();

    this.logger.log('ðŸ“– Starting book reindexing...');

    do {
      const result = await this.bookRepository.findAll(
        {},
        { page: currentPage, limit: this.PAGE_LIMIT },
      );
      const books = result.data;
      totalPages = result.meta.totalPages;

      if (currentPage === 1) {
        stats.total = result.meta.total;
        this.logger.log(
          `ðŸ“– Total books: ${stats.total} (${totalPages} pages)`,
        );
      }

      for (const book of books) {
        try {
          const titleStr = book.title.toString();
          const authorStr = book.authorName || 'KhÃ´ng rÃµ';
          const genreStr =
            book.genreObjects?.map((g) => g.name).join(', ') || '';

          const contextHeader = `SÃ¡ch: ${titleStr} | TÃ¡c giáº£: ${authorStr} | Thá»ƒ loáº¡i: ${genreStr}\nNá»™i dung: `;

          const descriptionClean = this.stripHtml(book.description);
          const chunks = this.chunkText(descriptionClean, 500);

          for (let i = 0; i < chunks.length; i++) {
            const document = VectorDocument.createBookDocument(
              this.idGenerator.generate(),
              book.id.toString(),
              contextHeader + chunks[i],
              {
                title: titleStr,
                author: authorStr,
                genres: genreStr,
                slug: book.slug,
                chunkIndex: i,
                totalChunks: chunks.length,
                type: 'book',
                bookId: book.id.toString(),
              },
              [],
            );
            batchBuffer.push(document);

            if (batchBuffer.length >= this.BATCH_THRESHOLD) {
              await this.flushBatch(batchBuffer, failedEntityIds, stats.errors);
              batchBuffer = [];
            }
          }
        } catch (error: unknown) {
          failedEntityIds.add(book.id.toString());
          this.addError(
            stats.errors,
            `Book ${String(book.id)}: ${getErrorMessage(error)}`,
          );
        }
      }

      currentPage++;
    } while (currentPage <= totalPages);

    if (batchBuffer.length > 0) {
      await this.flushBatch(batchBuffer, failedEntityIds, stats.errors);
    }

    stats.failed = failedEntityIds.size;
    stats.successful = stats.total - stats.failed;
    return stats;
  }

  private async flushBatch(
    batch: VectorDocument[],
    failedIds: Set<string>,
    errorList: string[],
  ): Promise<void> {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const result = await this.vectorRepository.saveBatch(batch);
        if (result.failed > 0) {
          for (const err of result.errors) {
            failedIds.add(err.contentId);
            this.addError(
              errorList,
              `Vector error for ${err.contentId}: ${err.error}`,
            );
          }
        }
        return; // Success or handled
      } catch (error: unknown) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          // If all retries failed, mark all entities in this batch as failed
          for (const doc of batch) {
            failedIds.add(doc.contentId);
          }
          this.addError(
            errorList,
            `Critical batch failure after ${MAX_RETRIES} attempts: ${getErrorMessage(error)}`,
          );
          break;
        }
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(
          `Batch save failed, retrying in ${delay}ms (Attempt ${attempt}/${MAX_RETRIES})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private addError(errorList: string[], message: string): void {
    if (errorList.length < this.MAX_ERRORS_IN_STATS) {
      errorList.push(message);
    } else if (errorList.length === this.MAX_ERRORS_IN_STATS) {
      errorList.push('... (Too many errors, further errors suppressed)');
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chunkText(
    text: string,
    size: number,
    overlap: number = 100,
  ): string[] {
    if (!text) return [];
    if (text.length <= size) return [text.trim()];

    const chunks: string[] = [];
    let current = 0;

    while (current < text.length) {
      let end = current + size;

      if (end < text.length) {
        const lookbackRange = Math.floor(size * 0.2);
        const lastSpace = text.lastIndexOf(' ', end);

        if (lastSpace > end - lookbackRange && lastSpace > current) {
          end = lastSpace;
        }
      }

      const chunk = text.substring(current, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      if (end >= text.length) break;

      const nextStep = end - overlap;
      current = nextStep > current ? nextStep : end;
    }

    return chunks;
  }
}
