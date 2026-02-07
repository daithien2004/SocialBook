import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Public } from '@/src/common/decorators/customize';
import { ScrapeBookUseCase } from '../application/use-cases/scrape-book.use-case';
import { ScrapeChapterUseCase } from '../application/use-cases/scrape-chapter.use-case';

@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly scrapeBookUseCase: ScrapeBookUseCase,
    private readonly scrapeChapterUseCase: ScrapeChapterUseCase,
  ) {}

  @Public()
  @Post('start')
  async startScraping(@Body('listUrl') listUrl: string) {
      return { success: false, message: 'Not implemented in refactor yet' };
  }

  @Public()
  @Post('full-book')
  async scrapeFullBook(@Body('bookUrl') bookUrl: string) {
     return { success: false, message: 'Not implemented in refactor yet' };
  }

  @Public()
  @Post('single')
  async scrapeSingleBook(@Body('bookUrl') bookUrl: string) {
    if (!bookUrl) return { success: false, message: 'bookUrl is required' };
    try {
      const result = await this.scrapeBookUseCase.execute(bookUrl);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Post('chapters')
  async scrapeChapters(@Body('bookId') bookId: string) {
      return { success: false, message: 'Not implemented in refactor yet' };
  }
}
