import { Injectable, Logger } from '@nestjs/common';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IVectorRepository, BatchIndexResult } from '@/domain/chroma/repositories/vector.repository.interface';
import { VectorDocument } from '@/domain/chroma/entities/vector-document.entity';
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

@Injectable()
export class ReindexAllUseCase {
  private readonly logger = new Logger(ReindexAllUseCase.name);

  constructor(
    private readonly authorRepository: IAuthorRepository,
    private readonly bookRepository: IBookRepository,
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(): Promise<ReindexResult> {
    try {
      this.logger.log('🚀 Starting full reindexing process...');

      // 1. Clear existing collection
      await this.vectorRepository.clearCollection();
      this.logger.log('🗑️ Vector collection cleared.');

      // 2. Reindex Authors
      const authorStats = await this.reindexAuthors();

      // 3. Reindex Books
      const bookStats = await this.reindexBooks();

      this.logger.log('✨ Full reindexing process completed!');

      return {
        success: true,
        details: { authors: authorStats, books: bookStats },
      };
    } catch (error) {
      this.logger.error('❌ Full reindexing failed:', error);
      throw error; 
    }
  }

  private async reindexAuthors(): Promise<IndexStats> {
    const stats: IndexStats = { total: 0, successful: 0, failed: 0, errors: [] };
    const authors = await this.authorRepository.findAllSimple();
    stats.total = authors.length;

    this.logger.log(`📚 Indexing ${authors.length} authors...`);

    const authorDocs: VectorDocument[] = [];

    for (const author of authors) {
      try {
        const bioClean = this.stripHtml(author.bio);
        const content = `Tác giả: ${author.name.toString()}\nTiểu sử: ${bioClean}`;

        const document = VectorDocument.createAuthorDocument(
          this.idGenerator.generate(),
          author.id.toString(),
          content,
          { name: author.name.toString(), type: 'author' },
          [],
        );
        authorDocs.push(document);
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Author ${author.id}: ${error.message}`);
      }
    }

    if (authorDocs.length > 0) {
      const result = await this.vectorRepository.saveBatch(authorDocs);
      stats.successful = result.successful;
      stats.failed += result.failed;
      stats.errors.push(...result.errors.map((e) => `Batch error: ${e.error}`));
    }

    return stats;
  }

  private async reindexBooks(): Promise<IndexStats> {
    const stats: IndexStats = { total: 0, successful: 0, failed: 0, errors: [] };
    const result = await this.bookRepository.findAll({}, { page: 1, limit: 1000 });
    const books = result.data;
    stats.total = books.length;

    this.logger.log(`📖 Indexing ${books.length} books with "Big Batch" strategy...`);

    const BATCH_THRESHOLD = 500; // Gom 500 documents rồi mới gửi 1 lần
    let batchBuffer: VectorDocument[] = [];

    for (const book of books) {
      try {
        const titleStr = book.title.toString();
        const authorStr = book.authorName || 'Không rõ';
        const genreStr = book.genreObjects?.map(g => g.name).join(', ') || '';
        
        // Tạo header ngữ cảnh cho mỗi mảnh
        const contextHeader = `Sách: ${titleStr} | Tác giả: ${authorStr} | Thể loại: ${genreStr}\nNội dung: `;
        
        const descriptionClean = this.stripHtml(book.description);
        const chunks = this.chunkText(descriptionClean, 500); 

        for (let i = 0; i < chunks.length; i++) {
          const document = VectorDocument.createBookDocument(
            this.idGenerator.generate(),
            book.id.toString(),
            contextHeader + chunks[i], // Hợp nhất ngữ cảnh vào nội dung vector
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

          // Nếu xe đã đầy thì khởi hành!
          if (batchBuffer.length >= BATCH_THRESHOLD) {
            const batchResult = await this.vectorRepository.saveBatch(batchBuffer);
            stats.successful += (batchBuffer.length / chunks.length); 
            batchBuffer = []; // Đổ hàng xong, làm trống xe
          }
        }
        
        this.logger.debug(`Processed metadata for book: ${book.title}`);
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Book ${book.id}: ${error.message}`);
      }
    }

    // Chuyến xe cuối cùng: Gửi nốt những món còn sót lại trong xe
    if (batchBuffer.length > 0) {
      await this.vectorRepository.saveBatch(batchBuffer);
      this.logger.log(`🚚 Final batch of ${batchBuffer.length} documents delivered.`);
    }

    // Cập nhật lại stats chính xác hơn
    stats.successful = stats.total - stats.failed;

    return stats;
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chunkText(text: string, size: number): string[] {
    if (!text) return [];
    const chunks: string[] = [];
    let current = 0;

    while (current < text.length) {
      let end = current + size;
      if (end < text.length) {
        // Cố gắng cắt ở khoảng trắng gần nhất để không bị đứt từ
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > current) {
          end = lastSpace;
        }
      }
      chunks.push(text.substring(current, end).trim());
      current = end + 1;
    }

    return chunks.filter(c => c.length > 0);
  }
}
