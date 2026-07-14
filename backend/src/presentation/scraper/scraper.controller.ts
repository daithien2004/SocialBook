import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '@/common/decorators/custom.decorator';
import { ScrapeBookUseCase } from '@/application/scraper/use-cases/scrape-book.use-case';
import { ScrapeChapterUseCase } from '@/application/scraper/use-cases/scrape-chapter.use-case';

@Controller('scraper')
export class ScraperController {
  constructor(
    private readonly scrapeBookUseCase: ScrapeBookUseCase,
    private readonly scrapeChapterUseCase: ScrapeChapterUseCase,
  ) {}

  @Public()
  @Post('start')
  startScraping() {
    return { success: false, message: 'Not implemented in refactor yet' };
  }

  @Public()
  @Post('full-book')
  scrapeFullBook() {
    return { success: false, message: 'Not implemented in refactor yet' };
  }

  @Public()
  @Post('single')
  async scrapeSingleBook(@Body('bookUrl') bookUrl: string) {
    if (!bookUrl) return { success: false, message: 'bookUrl is required' };
    try {
      const result = await this.scrapeBookUseCase.execute(bookUrl);
      return { success: true, data: result };
    } catch (error: unknown) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Public()
  @Post('chapters')
  scrapeChapters() {
    return { success: false, message: 'Not implemented in refactor yet' };
  }
}
