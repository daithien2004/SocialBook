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

import { ChromaInfrastructureModule } from '@/modules/chroma/infrastructure/public-api';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';
import { BookCacheAdapter } from '../../cache/book-cache.adapter';
import { ViewRankingCacheAdapter } from '../../cache/view-ranking-cache.adapter';
import {
  BookOutboxRecord,
  BookOutboxSchema,
} from '../../outbox/book-outbox.schema';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { BookOutboxRepository } from '../../outbox/book-outbox.repository';
import { MongoPersistenceModule } from '@/shared/infrastructure/mongo-persistence.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: BookOutboxRecord.name, schema: BookOutboxSchema },
    ]),
    MongoPersistenceModule,
    ChromaInfrastructureModule,
  ],
  providers: [
    BookOutboxRepository,
    { provide: BookOutboxPort, useExisting: BookOutboxRepository },
    {
      provide: IBookCachePort,
      useClass: BookCacheAdapter,
    },
    {
      provide: IViewRankingCachePort,
      useClass: ViewRankingCacheAdapter,
    },
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
    IBookCachePort,
    IViewRankingCachePort,
    BookOutboxPort,
  ],
})
export class BooksRepositoryModule {}
