import { ScrapedBookData, ScrapedChapterData } from './scraped-data.model';

export abstract class IScraperStrategy {
  abstract scrapeBook(url: string): Promise<ScrapedBookData>;
  abstract scrapeChapter(url: string): Promise<ScrapedChapterData>;
  abstract canHandle(url: string): boolean;
}
