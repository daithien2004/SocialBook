import { Injectable, BadRequestException } from '@nestjs/common';
import { IScraperStrategy } from '@/domain/scraper/interfaces/scraper-strategy.interface';
import { IScraperFactory } from '@/domain/scraper/interfaces/scraper-factory.interface';
import { TruyenFullStrategy } from './truyenfull.strategy';

@Injectable()
export class ScraperFactory extends IScraperFactory {
  constructor(private readonly truyenFullStrategy: TruyenFullStrategy) {
    super();
  }

  getStrategy(url: string): IScraperStrategy {
    const strategies: IScraperStrategy[] = [this.truyenFullStrategy];
    const strategy = strategies.find((s) => s.canHandle(url));
    if (!strategy) {
      throw new BadRequestException('Unsupported URL domain');
    }
    return strategy;
  }
}
