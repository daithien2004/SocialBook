import { Injectable, BadRequestException } from '@nestjs/common';
import { IScraperStrategy } from '@/domain/scraper/interfaces/scraper-strategy.interface';
import { IScraperFactory } from '@/domain/scraper/interfaces/scraper-factory.interface';

@Injectable()
export class ScraperFactory extends IScraperFactory {
  constructor(private readonly strategies: IScraperStrategy[]) {
    super();
  }

  getStrategy(url: string): IScraperStrategy {
    const strategy = this.strategies.find((s) => s.canHandle(url));
    if (!strategy) {
      throw new BadRequestException('Unsupported URL domain');
    }
    return strategy;
  }
}
