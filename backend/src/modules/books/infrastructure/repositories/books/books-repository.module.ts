import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
import { BookSearchReadRepository } from '@/modules/books/application/ports/book-search-read.repository';
import { BookIndexReadRepository } from '@/modules/books/application/ports/book-index-read.repository';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { Module } from '@nestjs/common';
import { PrismaBookReadRepository } from './prisma-book-read.repository';
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
    PrismaBookReadRepository,
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
      provide: BookReadRepository,
      useExisting: PrismaBookReadRepository,
    },
    {
      provide: BookSearchReadRepository,
      useExisting: PrismaBookReadRepository,
    },
    {
      provide: BookIndexReadRepository,
      useExisting: PrismaBookReadRepository,
    },
  ],
  exports: [
    IBookRepository,
    BookReadRepository,
    BookSearchReadRepository,
    BookIndexReadRepository,
    IBookCachePort,
    IViewRankingCachePort,
    BookOutboxPort,
  ],
})
export class BooksRepositoryModule {}
