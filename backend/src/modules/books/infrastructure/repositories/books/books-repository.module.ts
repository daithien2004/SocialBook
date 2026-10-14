import { BookReadRepository } from '@/modules/books/application/ports/book-read.repository';
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
      useClass: PrismaBookReadRepository,
    },
  ],
  exports: [
    IBookRepository,
    BookReadRepository,
    IBookCachePort,
    IViewRankingCachePort,
    BookOutboxPort,
  ],
})
export class BooksRepositoryModule {}
