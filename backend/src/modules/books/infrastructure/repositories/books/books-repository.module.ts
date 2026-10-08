import { IBookQueryProvider } from '@/modules/books/domain/books/repositories/book-query.provider.interface';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import {
  Author,
  AuthorSchema,
} from '@/modules/authors/infrastructure/schemas/public-api';
import {
  Book,
  BookSchema,
} from '@/modules/books/infrastructure/schemas/book.schema';
import {
  Chapter,
  ChapterSchema,
} from '@/modules/chapters/infrastructure/schemas/public-api';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookQueryProvider } from './book-query.provider';
import { BookRepository } from './book.repository';
import {
  Genre,
  GenreSchema,
} from '@/modules/genres/infrastructure/schemas/public-api';
import { TextSimilarityService } from '@/shared/domain/text-similarity.service';

import { ChromaInfrastructureModule } from '@/modules/chroma/infrastructure/chroma-infrastructure.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Genre.name, schema: GenreSchema },
    ]),
    ChromaInfrastructureModule,
  ],
  providers: [
    TextSimilarityService,
    {
      provide: IBookRepository,
      useClass: BookRepository,
    },
    {
      provide: IBookQueryProvider,
      useClass: BookQueryProvider,
    },
  ],
  exports: [IBookRepository, IBookQueryProvider],
})
export class BooksRepositoryModule {}
