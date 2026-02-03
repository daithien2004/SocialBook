import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { BooksRepository } from './books.repository';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SearchModule } from '../search/search.module';
import { AuthorsModule } from '../authors/authors.module';
import { ChaptersModule } from '../chapters/chapters.module';

import { GenresModule } from '../genres/genres.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    CloudinaryModule,
    SearchModule,
    AuthorsModule,
    ChaptersModule,
    GenresModule,
    ReviewsModule,
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  providers: [BooksService, BooksRepository],
  controllers: [BooksController],
  exports: [BooksService, BooksRepository, MongooseModule],
})
export class BooksModule { }
