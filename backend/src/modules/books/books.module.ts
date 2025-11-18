import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema';
import { Author, AuthorSchema } from '../authors/schemas/author.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Review.name, schema: ReviewSchema },

    ]),
  ],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [BooksService, MongooseModule],
})
export class BooksModule { }
