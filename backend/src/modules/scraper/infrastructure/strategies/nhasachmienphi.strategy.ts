import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { IScraperStrategy } from '../../domain/interfaces/scraper-strategy.interface';
import { ScrapedBookData, ScrapedChapterData } from '../../domain/models/scraped-data.model';

@Injectable()
export class NhaSachMienPhiStrategy implements IScraperStrategy {
  private readonly logger = new Logger(NhaSachMienPhiStrategy.name);
  private readonly baseUrl = 'https://nhasachmienphi.com';

  constructor(private readonly httpService: HttpService) {}

  canHandle(url: string): boolean {
    return url.includes('nhasachmienphi.com');
  }

  async scrapeBook(url: string): Promise<ScrapedBookData> {
    try {
        const response = await firstValueFrom(
            this.httpService.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
        );
        const $ = cheerio.load(response.data);

        const title = $('h1.tblue.fs-20, h1.tblue').first().text().trim();
        const authorText = $('div.mg-t-10:contains("Tác giả:")').text();
        const author = authorText ? authorText.replace('Tác giả:', '').trim() : 'Unknown';
        
        // ... (reuse logic from original service for scraping definition) ...
        const genre = $('div.mg-tb-10 a.tblue').first().text().trim() || 'Uncategorized';
        let imageUrl = $('img[src*="thumbnail"]').first().attr('src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = this.baseUrl + imageUrl;
        }

        const description = $('div.gioi_thieu_sach').text().trim() || $('meta[name="description"]').attr('content') || '';

        return {
            title,
            author,
            description,
            coverUrl: imageUrl,
            genres: [genre],
            status: 'published', // NSMP usually complete books mostly?
            sourceUrl: url,
            // chapters logic can be separate or included if we want full scrape immediately
        };
    } catch (error) {
        this.logger.error(`Error scraping NSMP book ${url}: ${error.message}`);
        throw error;
    }
  }

  async scrapeChapter(url: string): Promise<ScrapedChapterData> {
       try {
           const response = await firstValueFrom(
             this.httpService.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
           );
           const $ = cheerio.load(response.data);
           
           let title = $('h2.mg-t-10').text().trim();
           if (!title) title = $('h2').first().text().trim();

           const paragraphs: { content: string }[] = [];
           $('.noi_dung_online p, .content_p p').each((_, el) => {
               const text = $(el).text().trim();
               if(text) paragraphs.push({ content: text });
           });

           return {
               title,
               order: 0,
               content: '',
               paragraphs
           };
       } catch (error) {
           throw error;
       }
  }

  async scrapeCategory(url: string, limit: number = 20): Promise<string[]> {
      // Implement category crawling
      return [];
  }
}
