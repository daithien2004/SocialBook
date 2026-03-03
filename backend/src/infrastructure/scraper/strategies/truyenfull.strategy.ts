import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { IScraperStrategy } from '@/domain/scraper/interfaces/scraper-strategy.interface';
import { ScrapedBookData, ScrapedChapterData } from '@/domain/scraper/models/scraped-data.model';

@Injectable()
export class TruyenFullStrategy implements IScraperStrategy {
  private readonly logger = new Logger(TruyenFullStrategy.name);
  private readonly baseUrl = 'https://truyenfull.vision';

  constructor(private readonly httpService: HttpService) {}

  canHandle(url: string): boolean {
    return url.includes('truyenfull.vision') || url.includes('truyenfull.vn');
  }

  async scrapeBook(url: string): Promise<ScrapedBookData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      );
      const $ = cheerio.load(response.data);

      const title =
        $('.col-info-desc .title').text().trim() ||
        $('.title-book').text().trim() ||
        $('h3.title').text().trim();

      const author = $('.info a[itemprop="author"]').text().trim();
      const description = $('.desc-text').text().trim();
      const coverUrl = $('.book img').attr('src') || '';

      const genres: string[] = [];
      $('.info a[itemprop="genre"]').each((_, el) => {
        genres.push($(el).text().trim());
      });

      const statusText = $('.text-success').text() || $('.info').text();
      let status = 'published';
      if (statusText.includes('Full') || statusText.includes('Hoàn')) {
        status = 'completed';
      }

      const slug = this.extractSlugFromUrl(url);

      return {
        title,
        author,
        description,
        coverUrl,
        genres,
        status,
        sourceUrl: url,
        slug
      };
    } catch (error) {
        this.logger.error(`Error scraping book ${url}: ${error.message}`);
        throw error;
    }
  }

  async scrapeChapter(url: string): Promise<ScrapedChapterData> {
     try {
        const response = await firstValueFrom(
            this.httpService.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        );
        const $ = cheerio.load(response.data);

        let title = $('.chapter-title').text().trim();
        if (!title) title = $('h2').text().trim();

        const contentEl = $('#chapter-c');
        contentEl.find('script, .ads-responsive, div[id^="ads"], .ads-holder, .incontent-ad').remove();
        
        // Simple text extraction for now, or sophisticated as in original service
        // Let's use the split token method if needed, or just paragraphs
        let content = contentEl.html() || '';
        // Basic cleaning
        content = content.replace(/<br\s*\/?>/gi, '\n');
        
        const temp$ = cheerio.load(content);
        const textContent = temp$('*').text();
        const paragraphs = textContent.split('\n').map(p => p.trim()).filter(p => p.length > 0).map(p => ({ content: p }));

        return {
            title,
            order: 0, // Order needs to be determined by caller or parsed from title/url
            content: content,
            paragraphs
        };
     } catch (error) {
         this.logger.error(`Error scraping chapter ${url}: ${error.message}`);
         throw error;
     }
  }

  private extractSlugFromUrl(url: string): string {
    // ... logic from original service
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const segments = path.split('/').filter((segment) => segment.length > 0);
      return segments.length > 0 ? segments[segments.length - 1] : '';
    } catch (e) {
        return '';
    }
  }
}

