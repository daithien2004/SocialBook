import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  /**
   * Cào cả một danh sách (Ví dụ: danh sách Tiên hiệp hot)
   * Tùy chọn `scrapeChapters: true` để lấy luôn chương của từng truyện
   */
  @Public()
  @Post('start')
  async startScraping(
    @Body('listUrl') listUrl: string,
    @Body('maxPages') maxPages?: number,
    @Body('scrapeChapters') scrapeChapters?: boolean,
    @Body('chapterLimit') chapterLimit?: number,
  ) {
    if (!listUrl) return { success: false, message: 'listUrl is required' };
    try {
      const stats = await this.scraperService.scrapeAndSaveAllBooks(
        listUrl,
        maxPages || null,
        scrapeChapters || false,
        chapterLimit,
      );
      return { success: true, message: 'Scraping process completed', stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Cào full 1 cuốn sách (Thông tin + Tất cả chương)
   * Chỉ cần gửi URL sách là xong.
   */
  @Public()
  @Post('full-book')
  async scrapeFullBook(@Body('bookUrl') bookUrl: string) {
    if (!bookUrl) return { success: false, message: 'bookUrl is required' };
    try {
      const result = await this.scraperService.scrapeBookAndChapters(bookUrl);
      return {
        success: true,
        message: 'Scrape full book success',
        data: result,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Public()
  @Post('single')
  async scrapeSingleBook(@Body('bookUrl') bookUrl: string) {
    if (!bookUrl) return { success: false, message: 'bookUrl is required' };
    try {
      const bookData = await this.scraperService.scrapeBookData(bookUrl);
      return { success: true, data: bookData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Bắt đầu cào chapters cho 1 cuốn sách
   * Body: { "bookId": "ID_CUA_SACH_TRONG_DB" }
   */
  @Public()
  @Post('chapters')
  async scrapeChapters(@Body('bookId') bookId: string) {
    if (!bookId) {
      return { success: false, message: 'bookId is required' };
    }

    try {
      const stats = await this.scraperService.scrapeAndSaveChapters(bookId);
      return {
        success: true,
        message: 'Hoàn thành cào chapters',
        stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Public()
  @Get('test')
  async testScraping(@Query('url') url: string) {
    if (!url)
      return { success: false, message: 'url query parameter is required' };
    try {
      const stats = await this.scraperService.scrapeAndSaveAllBooks(url, 1);
      return { success: true, message: 'Test completed (1 page only)', stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
