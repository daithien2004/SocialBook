import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ScrapeBookUseCase } from '@/application/scraper/use-cases/scrape-book.use-case';
import { ScrapeChapterUseCase } from '@/application/scraper/use-cases/scrape-chapter.use-case';

@Controller('scraper')
@Roles('admin')
@UseGuards(RolesGuard)
export class ScraperController {
  constructor(
    private readonly scrapeBookUseCase: ScrapeBookUseCase,
    private readonly scrapeChapterUseCase: ScrapeChapterUseCase,
  ) {}

  @Post('start')
  startScraping() {
    return { success: false, message: 'Not implemented in refactor yet' };
  }

  @Post('full-book')
  scrapeFullBook() {
    return { success: false, message: 'Not implemented in refactor yet' };
  }

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

  @Post('chapters')
  scrapeChapters() {
    return { success: false, message: 'Not implemented in refactor yet' };
  }
}
