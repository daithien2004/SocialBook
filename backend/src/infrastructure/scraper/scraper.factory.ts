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
    if (this.truyenFullStrategy.canHandle(url)) {
      return this.truyenFullStrategy;
    }
    throw new BadRequestException('Unsupported URL domain');
  }
}
