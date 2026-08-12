import { ScrapedBookData, ScrapedChapterData } from './scraped-data.model';

export interface IScraperStrategy {
  scrapeBook(url: string): Promise<ScrapedBookData>;
  scrapeChapter(url: string): Promise<ScrapedChapterData>;
  canHandle(url: string): boolean;
}
