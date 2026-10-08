import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Logger } from '@nestjs/common';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { VectorDocument } from '@/modules/chroma/domain/entities/vector-document.entity';
import { BookId } from '@/modules/books/domain/public-api';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { ContentType } from '@/modules/chroma/domain/value-objects/content-type.vo';
import { ChromaBookJobSchema } from '@/shared/queue/job-payload.schemas';

interface ChromaIndexBookJobData {
  bookId: string;
}

interface ChromaDeleteBookJobData {
  bookId: string;
}

type ChromaJobData = ChromaIndexBookJobData | ChromaDeleteBookJobData;

@Processor('chroma', {
  // concurrency: 3 â€” thá»­ nghiá»‡m theo kháº£ nÄƒng cá»§a Chroma vÃ  embedding API.
  // TÄƒng lÃªn náº¿u Chroma khÃ´ng pháº£n há»“i láº­u.
  concurrency: 3,
})
export class ChromaProcessor extends WorkerHost {
  private readonly logger = new Logger(ChromaProcessor.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {
    super();
  }

  async process(job: Job<ChromaJobData, void>): Promise<void> {
    const parsed = ChromaBookJobSchema.safeParse(job.data);
    if (!parsed.success) {
      throw new UnrecoverableError(
        `Invalid chroma payload: ${parsed.error.message}`,
      );
    }

    if (job.name === 'index-book') {
      await this.handleBookUpserted(parsed.data);
    } else if (job.name === 'delete-book-index') {
      await this.handleBookDeleted(parsed.data);
    }
  }

  private async handleBookUpserted(payload: { bookId: string }) {
    try {
      this.logger.log(`Processing vector index for book: ${payload.bookId}`);

      const bookId = BookId.create(payload.bookId);
      const book = await this.bookRepository.findById(bookId);

      if (!book) {
        // SÃ¡ch Ä‘Ã£ bá»‹ xÃ³a trong lÃºc job Ä‘ang chá» â€” dá»n index má»“ cÃ´i thay vÃ¬ táº¡o má»›i.
        this.logger.warn(
          `Book ${payload.bookId} no longer exists â€” cleaning up orphan index instead of creating new one.`,
        );
        await this.handleBookDeleted(payload);
        return;
      }

      const contentType = ContentType.create('book');

      // 1. Delete old vectors for this book to avoid duplicates on update
      await this.vectorRepository.deleteByContentId(
        payload.bookId,
        contentType,
      );

      if (book.status.toString() !== 'published') {
        this.logger.log(
          `Book ${payload.bookId} is not published, skipping new vectors.`,
        );
        return;
      }

      // 2. Prepare chunks
      const titleStr = book.title.toString();
      const authorStr = book.authorName || book.author?.name || 'KhÃ´ng rÃµ';
      const genreStr = book.genreObjects?.map((g) => g.name).join(', ') || '';

      const contextHeader = `SÃ¡ch: ${titleStr} | TÃ¡c giáº£: ${authorStr} | Thá»ƒ loáº¡i: ${genreStr}\nNá»™i dung: `;

      const descriptionClean = this.stripHtml(book.description);
      const chunks = this.chunkText(descriptionClean, 500);

      const batchBuffer: VectorDocument[] = [];

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
      }

      // 3. Save to Vector Store
      if (batchBuffer.length > 0) {
        const result = await this.vectorRepository.saveBatch(batchBuffer);
        if (result.failed > 0) {
          throw new Error(
            `Failed to index some chunks for book ${payload.bookId}`,
          );
        } else {
          book.markVectorIndexed();
          await this.bookRepository.save(book);

          this.logger.log(
            `Successfully updated vector index for book ${payload.bookId} (${chunks.length} chunks)`,
          );
        }
      }
    } catch (error: unknown) {
      this.logger.error(
        `Failed to handle vector index for book ${payload.bookId}: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  private async handleBookDeleted(payload: { bookId: string }) {
    try {
      this.logger.log(
        `Removing vector index for deleted book: ${payload.bookId}`,
      );
      const contentType = ContentType.create('book');
      await this.vectorRepository.deleteByContentId(
        payload.bookId,
        contentType,
      );
      this.logger.log(
        `Successfully removed vector index for book ${payload.bookId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to remove vector index for book ${payload.bookId}: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  private stripHtml(html: string | undefined): string {
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
