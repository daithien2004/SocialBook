import { Injectable, BadRequestException } from '@nestjs/common';
import { IScraperStrategy } from '@/domain/scraper/interfaces/scraper-strategy.interface';
import { TruyenFullStrategy } from '../../strategies/truyenfull.strategy';
import { NhaSachMienPhiStrategy } from '../../strategies/nhasachmienphi.strategy';

@Injectable()
export class ScraperFactory {
  constructor(
    private readonly truyenFullStrategy: TruyenFullStrategy,
    private readonly nhaSachMienPhiStrategy: NhaSachMienPhiStrategy,
  ) {}

  getStrategy(url: string): IScraperStrategy {
    if (this.truyenFullStrategy.canHandle(url)) {
      return this.truyenFullStrategy;
    }
    if (this.nhaSachMienPhiStrategy.canHandle(url)) {
      return this.nhaSachMienPhiStrategy;
    }
    throw new BadRequestException('Unsupported URL domain');
  }
}

