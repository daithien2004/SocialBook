import { Injectable, Logger } from '@nestjs/common';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { ScraperFactory } from '@/infrastructure/scraper/factories/scraper.factory';
import { ScrapedChapterData } from '@/domain/scraper/models/scraped-data.model';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { Chapter } from '@/domain/chapters/entities/chapter.entity';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@Injectable()
export class ScrapeChapterUseCase {
  private readonly logger = new Logger(ScrapeChapterUseCase.name);

  constructor(
    private readonly scraperFactory: ScraperFactory,
    private readonly chapterRepository: IChapterRepository,
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    bookIdStr: string,
    chapterUrl: string,
    orderIndexNum: number,
  ): Promise<any> {
    try {
      const bookId = BookId.create(bookIdStr);
      const book = await this.bookRepository.findById(bookId);
      if (!book) throw new Error('Book not found');

      const strategy = this.scraperFactory.getStrategy(chapterUrl);
      const chapterData: ScrapedChapterData =
        await strategy.scrapeChapter(chapterUrl);

      // Check existing
      const slug = this.extractSlug(chapterUrl) || chapterData.title;

      const chapter = Chapter.create({
        id: ChapterId.create(this.idGenerator.generate()),
        bookId: bookIdStr,
        title: chapterData.title,
        paragraphs: (chapterData.paragraphs || []).map((p) => ({
          content: p.content,
        })),
        orderIndex: orderIndexNum,
      });

      await this.chapterRepository.save(chapter);
      return chapter;
    } catch (error) {
      this.logger.error(
        `Failed to scrape chapter ${chapterUrl}: ${error.message}`,
      );
      throw error;
    }
  }

  private extractSlug(url: string): string {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter((p) => !!p);
      return parts[parts.length - 1];
    } catch {
      return '';
    }
  }
}
