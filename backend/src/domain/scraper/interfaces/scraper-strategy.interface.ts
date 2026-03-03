import { ScrapedBookData, ScrapedChapterData } from '../models/scraped-data.model';

export interface IScraperStrategy {
  scrapeBook(url: string): Promise<ScrapedBookData>;
  scrapeChapter(url: string): Promise<ScrapedChapterData>;
  scrapeCategory?(url: string, limit?: number): Promise<string[]>; // Returns list of book URLs
  canHandle(url: string): boolean;
}
