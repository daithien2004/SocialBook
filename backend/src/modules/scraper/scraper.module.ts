import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Author, AuthorSchema } from '../authors/schemas/author.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
  ],
  controllers: [ScraperController],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
