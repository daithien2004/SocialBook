import { Injectable, BadRequestException } from '@nestjs/common';
import { IScraperStrategy } from '@/domain/scraper/interfaces/scraper-strategy.interface';
import { TruyenFullStrategy } from '../strategies/truyenfull.strategy';

@Injectable()
export class ScraperFactory {
  constructor(
    private readonly truyenFullStrategy: TruyenFullStrategy,
  ) {}

  getStrategy(url: string): IScraperStrategy {
    if (this.truyenFullStrategy.canHandle(url)) {
      return this.truyenFullStrategy;
    }
    throw new BadRequestException('Unsupported URL domain');
  }
}
