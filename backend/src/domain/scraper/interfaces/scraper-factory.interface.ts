import { IScraperStrategy } from './scraper-strategy.interface';

export abstract class IScraperFactory {
  abstract getStrategy(url: string): IScraperStrategy;
}
