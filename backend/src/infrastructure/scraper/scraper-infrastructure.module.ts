import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IScraperFactory } from '@/domain/scraper/interfaces/scraper-factory.interface';
import { IScraperStrategy } from '@/domain/scraper/interfaces/scraper-strategy.interface';
import { ScraperFactory } from './scraper.factory';
import { TruyenFullStrategy } from './truyenfull.strategy';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: IScraperStrategy,
      useClass: TruyenFullStrategy,
    },
    {
      provide: IScraperFactory,
      useClass: ScraperFactory,
    },
  ],
  exports: [IScraperFactory],
})
export class ScraperInfrastructureModule {}
