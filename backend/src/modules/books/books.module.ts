import { DataAccessModule } from '@/src/data-access/data-access.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorsModule } from '../authors/authors.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SearchModule } from '../search/search.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book, BookSchema } from './schemas/book.schema';

import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    DataAccessModule,
    CloudinaryModule,
    SearchModule,
    AuthorsModule,
    ReviewsModule,
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [BooksService, MongooseModule, DataAccessModule],
})
export class BooksModule { }
