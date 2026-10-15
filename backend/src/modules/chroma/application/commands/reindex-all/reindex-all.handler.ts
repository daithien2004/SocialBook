import { ReindexAllCommand } from './reindex-all.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { Logger } from '@nestjs/common';
import { AuthorIndexReadRepository } from '@/modules/authors';
import { BookIndexReadRepository } from '@/modules/books';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { VectorDocument } from '@/modules/chroma/domain/entities/vector-document.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ForbiddenError } from '@casl/ability';
import type {
  ReindexResult,
  ReindexStatsResult,
} from '@/modules/chroma/application/chroma.result';

@CommandHandler(ReindexAllCommand)
export class ReindexAllHandler implements ICommandHandler<ReindexAllCommand> {
  private readonly logger = new Logger(ReindexAllHandler.name);
  private readonly BATCH_THRESHOLD = 500;
  private readonly PAGE_LIMIT = 100;
  private readonly MAX_ERRORS_IN_STATS = 100;

  constructor(
    private readonly authorRepository: AuthorIndexReadRepository,
    private readonly bookRepository: BookIndexReadRepository,
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: ReindexAllCommand): Promise<ReindexResult> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      'Search',
    );
    try {
      this.logger.log('🚀 Starting full reindexing process...');

      // 1. Clear existing collection
      // Lưu ý: Hiện tại Repository chưa hỗ trợ cơ chế Swap Collection (Blue-Green).
      // Chúng ta chấp nhận rủi ro downtime ngắn trong lúc reindex.
      await this.vectorRepository.clearCollection();
      this.logger.log('🗑️ Vector collection cleared.');

      // 2. Run Reindexing in Parallel for performance
      this.logger.log('⚡ Running Author and Book reindexing in parallel...');
      const [authorStats, bookStats] = await Promise.all([
        this.reindexAuthors(),
        this.reindexBooks(),
      ]);

      this.logger.log('✨ Full reindexing process completed!');

      return {
        success: true,
        details: { authors: authorStats, books: bookStats },
      };
    } catch (error: unknown) {
      this.logger.error('❌ Full reindexing failed:', error);
      throw error;
    }
  }

  private async reindexAuthors(): Promise<ReindexStatsResult> {
    const stats: ReindexStatsResult = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };
    let offset = 0;
    let total = 0;
    let batchBuffer: VectorDocument[] = [];
    const failedEntityIds = new Set<string>();

    this.logger.log('📚 Starting author reindexing...');

    do {
      const result = await this.authorRepository.findIndexPage({
        offset,
        limit: this.PAGE_LIMIT,
      });
      const authors = result.items;
      total = result.total;

      if (offset === 0) {
        stats.total = result.total;
        this.logger.log(`📚 Total authors: ${stats.total.toLocaleString()}`);
      }

      for (const author of authors) {
        try {
          const bioClean = this.stripHtml(author.bio);
          const content = `Tác giả: ${author.name}\nTiểu sử: ${bioClean}`;

          const document = VectorDocument.createAuthorDocument(
            this.idGenerator.generate(),
            author.id,
            content,
            { name: author.name, type: 'author' },
            [],
          );
          batchBuffer.push(document);

          if (batchBuffer.length >= this.BATCH_THRESHOLD) {
            await this.flushBatch(batchBuffer, failedEntityIds, stats.errors);
            batchBuffer = [];
          }
        } catch (error: unknown) {
          failedEntityIds.add(author.id);
          this.addError(
            stats.errors,
            `Author ${author.id}: ${getErrorMessage(error)}`,
          );
        }
      }
      offset += this.PAGE_LIMIT;
    } while (offset < total);

    if (batchBuffer.length > 0) {
      await this.flushBatch(batchBuffer, failedEntityIds, stats.errors);
    }

    stats.failed = failedEntityIds.size;
    stats.successful = stats.total - stats.failed;
    return stats;
  }

  private async reindexBooks(): Promise<ReindexStatsResult> {
    const stats: ReindexStatsResult = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };
    let currentPage = 1;
    let totalPages = 1;
    let batchBuffer: VectorDocument[] = [];
    const failedEntityIds = new Set<string>();

    this.logger.log('📖 Starting book reindexing...');

    do {
      const result = await this.bookRepository.findIndexPage({
        page: currentPage,
        limit: this.PAGE_LIMIT,
      });
      const books = result.data;
      totalPages = result.meta.totalPages;

      if (currentPage === 1) {
        stats.total = result.meta.total;
        this.logger.log(`📖 Total books: ${stats.total.toLocaleString()}`);
      }

      for (const book of books) {
        try {
          const titleStr = book.title;
          const authorStr = book.authorName || 'Không rõ';
          const genreStr = book.genres.map((genre) => genre.name).join(', ');

          const contextHeader = `Sách: ${titleStr} | Tác giả: ${authorStr} | Thể loại: ${genreStr}\nNội dung: `;

          const descriptionClean = this.stripHtml(book.description);
          const chunks = this.chunkText(descriptionClean, 500);

          for (let i = 0; i < chunks.length; i++) {
            const document = VectorDocument.createBookDocument(
              this.idGenerator.generate(),
              book.id,
              contextHeader + chunks[i],
              {
                title: titleStr,
                author: authorStr,
                genres: genreStr,
                slug: book.slug,
                chunkIndex: i,
                totalChunks: chunks.length,
                type: 'book',
                bookId: book.id,
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
          failedEntityIds.add(book.id);
          this.addError(
            stats.errors,
            `Book ${book.id}: ${getErrorMessage(error)}`,
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
            `Critical batch failure after ${MAX_RETRIES.toFixed(0)} attempts: ${getErrorMessage(error)}`,
          );
          break;
        }
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(
          `Batch save failed, retrying in ${delay.toFixed(0)}ms (Attempt ${attempt.toFixed(0)}/${MAX_RETRIES.toFixed(0)})...`,
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
