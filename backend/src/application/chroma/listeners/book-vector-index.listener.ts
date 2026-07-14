import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { VectorDocument } from '@/domain/chroma/entities/vector-document.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { getErrorMessage } from '@/common/utils/error.util';
import { ContentType } from '@/domain/chroma/value-objects/content-type.vo';

@Injectable()
export class BookVectorIndexListener {
  private readonly logger = new Logger(BookVectorIndexListener.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  @OnEvent('book.created', { async: true })
  @OnEvent('book.updated', { async: true })
  async handleBookUpserted(payload: { bookId: string }) {
    try {
      this.logger.log(`Processing vector index for book: ${payload.bookId}`);

      const bookId = BookId.create(payload.bookId);
      const book = await this.bookRepository.findById(bookId);

      if (!book) {
        this.logger.warn(
          `Book ${payload.bookId} not found, skipping indexing.`,
        );
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
      const authorStr = book.authorName || book.author?.name || 'Không rõ';
      const genreStr = book.genreObjects?.map((g) => g.name).join(', ') || '';

      const contextHeader = `Sách: ${titleStr} | Tác giả: ${authorStr} | Thể loại: ${genreStr}\nNội dung: `;

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
          this.logger.error(
            `Failed to index some chunks for book ${payload.bookId}`,
          );
        } else {
          this.logger.log(
            `Successfully updated vector index for book ${payload.bookId} (${chunks.length} chunks)`,
          );
        }
      }
    } catch (error: unknown) {
      this.logger.error(
        `Failed to handle vector index for book ${payload.bookId}: ${getErrorMessage(error)}`,
      );
    }
  }

  @OnEvent('book.deleted', { async: true })
  async handleBookDeleted(payload: { bookId: string }) {
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
