import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScraperFactory } from './factories/scraper.factory';
import { TruyenFullStrategy } from './strategies/truyenfull.strategy';

@Module({
  imports: [HttpModule],
  providers: [ScraperFactory, TruyenFullStrategy],
  exports: [ScraperFactory, TruyenFullStrategy],
})
export class ScraperInfrastructureModule {}
