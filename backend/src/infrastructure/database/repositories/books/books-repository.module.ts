import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '@/infrastructure/database/schemas/book.schema';
import { Chapter, ChapterSchema } from '@/infrastructure/database/schemas/chapter.schema';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookRepository } from './book.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
  ],
  providers: [
    {
      provide: IBookRepository,
      useClass: BookRepository,
    },
  ],
  exports: [
    IBookRepository,
    MongooseModule,
  ],
})
export class BooksRepositoryModule { }
