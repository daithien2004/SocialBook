import { Module } from '@nestjs/common';
import { BooksApplicationModule } from './application/books/books-application.module';
import { BooksController } from './presentation/books/books.controller';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { SearchModule } from '@/modules/search';

@Module({
  imports: [BooksApplicationModule, MediaInfrastructureModule, SearchModule],
  controllers: [BooksController],
})
export class BooksModule {}
