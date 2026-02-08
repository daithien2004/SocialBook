import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScraperFactory } from './factories/scraper.factory';
import { TruyenFullStrategy } from '../strategies/truyenfull.strategy';
import { NhaSachMienPhiStrategy } from '../strategies/nhasachmienphi.strategy';

@Module({
  imports: [HttpModule],
  providers: [
    ScraperFactory,
    TruyenFullStrategy,
    NhaSachMienPhiStrategy,
  ],
  exports: [
    ScraperFactory,
    TruyenFullStrategy,
    NhaSachMienPhiStrategy,
  ],
})
export class ScraperInfrastructureModule {}
