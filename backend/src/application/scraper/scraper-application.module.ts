import { Module } from '@nestjs/common';
import { ScrapeBookUseCase } from './use-cases/scrape-book.use-case';
import { ScrapeChapterUseCase } from './use-cases/scrape-chapter.use-case';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { ScraperInfrastructureModule } from '@/infrastructure/scraper/scraper-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';

@Module({
  imports: [
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    AuthorsRepositoryModule,
    GenresRepositoryModule,
    ScraperInfrastructureModule,
    IdGeneratorModule,
  ],
  providers: [ScrapeBookUseCase, ScrapeChapterUseCase],
  exports: [ScrapeBookUseCase, ScrapeChapterUseCase],
})
export class ScraperApplicationModule {}
