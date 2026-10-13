import { IBookQueryProvider } from '@/modules/books/domain/books/repositories/book-query.provider.interface';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { Module } from '@nestjs/common';
import { BookQueryProvider } from './book-query.provider';
import { BookRepository } from './book.repository';

import { ChromaInfrastructureModule } from '@/modules/chroma/infrastructure/public-api';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';
import { BookCacheAdapter } from '../../cache/book-cache.adapter';
import { ViewRankingCacheAdapter } from '../../cache/view-ranking-cache.adapter';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { BookOutboxRepository } from '../../outbox/book-outbox.repository';

@Module({
  imports: [ChromaInfrastructureModule],
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
