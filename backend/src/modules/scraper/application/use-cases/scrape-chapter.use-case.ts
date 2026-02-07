import { Injectable, Logger, Inject } from '@nestjs/common';
import { IChapterRepository } from '@/src/modules/chapters/domain/repositories/chapter.repository.interface';
import { IBookRepository } from '@/src/modules/books/domain/repositories/book.repository.interface';
import { ScraperFactory } from '../../infrastructure/factories/scraper.factory';
import { ScrapedChapterData } from '../../domain/models/scraped-data.model';
import { BookId } from '@/src/modules/books/domain/value-objects/book-id.vo';

@Injectable()
export class ScrapeChapterUseCase {
  private readonly logger = new Logger(ScrapeChapterUseCase.name);

  constructor(
    private readonly scraperFactory: ScraperFactory,
    private readonly chapterRepository: IChapterRepository,
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(bookIdStr: string, chapterUrl: string, orderIndex: number): Promise<any> {
    try {
      const bookId = BookId.create(bookIdStr);
      const book = await this.bookRepository.findById(bookId);
      if (!book) throw new Error('Book not found');

      const strategy = this.scraperFactory.getStrategy(chapterUrl);
      const chapterData: ScrapedChapterData = await strategy.scrapeChapter(chapterUrl);

      // Check existing
      const slug = this.extractSlug(chapterUrl) || chapterData.title; 
      
      // Save logic 
       return await (this.chapterRepository as any).create({
           bookId: bookIdStr, 
           title: chapterData.title,
           slug: slug,
           paragraphs: chapterData.paragraphs,
           orderIndex: orderIndex,
           content: chapterData.content
       });

    } catch (error) {
      this.logger.error(`Failed to scrape chapter ${chapterUrl}: ${error.message}`);
      throw error;
    }
  }

  private extractSlug(url: string): string {
      try {
          const u = new URL(url);
          const parts = u.pathname.split('/').filter(p => !!p);
          return parts[parts.length - 1];
      } catch { return ''; }
  }
}
