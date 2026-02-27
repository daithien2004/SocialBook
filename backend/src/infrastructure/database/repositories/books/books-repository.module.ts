import { IBookQueryProvider } from '@/domain/books/repositories/book-query.provider.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Author, AuthorSchema } from '@/infrastructure/database/schemas/author.schema';
import { Book, BookSchema } from '@/infrastructure/database/schemas/book.schema';
import { Chapter, ChapterSchema } from '@/infrastructure/database/schemas/chapter.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookQueryProvider } from './book-query.provider';
import { BookRepository } from './book.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Author.name, schema: AuthorSchema },
    ]),
  ],
  providers: [
    {
      provide: IBookRepository,
      useClass: BookRepository,
    },
    {
      provide: IBookQueryProvider,
      useClass: BookQueryProvider,
    },
  ],
  exports: [
    IBookRepository,
    IBookQueryProvider,
    MongooseModule,
  ],
})
export class BooksRepositoryModule { }
