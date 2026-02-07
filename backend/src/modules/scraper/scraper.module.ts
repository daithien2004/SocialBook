import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ScraperController } from './presentation/scraper.controller';
import { ScraperFactory } from './infrastructure/factories/scraper.factory';
import { TruyenFullStrategy } from './infrastructure/strategies/truyenfull.strategy';
import { NhaSachMienPhiStrategy } from './infrastructure/strategies/nhasachmienphi.strategy';
import { ScrapeBookUseCase } from './application/use-cases/scrape-book.use-case';
import { ScrapeChapterUseCase } from './application/use-cases/scrape-chapter.use-case';
// Import Modules that provide repositories
import { BooksModule } from '../books/books.module';
import { AuthorsModule } from '../authors/authors.module';
import { GenresModule } from '../genres/genres.module';
import { ChaptersModule } from '../chapters/chapters.module';

@Module({
  imports: [
    HttpModule,
    BooksModule,
    AuthorsModule,
    GenresModule,
    ChaptersModule
  ],
  controllers: [ScraperController],
  providers: [
    ScraperFactory,
    TruyenFullStrategy,
    NhaSachMienPhiStrategy,
    ScrapeBookUseCase,
    ScrapeChapterUseCase,
  ],
  exports: [
    ScrapeBookUseCase,
    ScrapeChapterUseCase
  ],
})
export class ScraperModule {}
