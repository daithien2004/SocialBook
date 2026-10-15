import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { PrismaUnitOfWork } from '@/core/database/postgres/prisma-unit-of-work';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/modules/library/domain/library/repositories/reading-progress.repository.interface';
import { LibraryReadRepository } from '@/modules/library/application/ports/library-read.repository';
import { CollectionReadRepository } from '@/modules/library/application/ports/collection-read.repository';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { CollectionRepository } from './collection.repository';
import { ReadingListRepository } from './reading-list.repository';
import { ReadingProgressRepository } from './reading-progress.repository';
import { PrismaLibraryReadRepository } from './prisma-library-read.repository';
import { PrismaCollectionReadRepository } from './prisma-collection-read.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    { provide: UnitOfWorkPort, useExisting: PrismaUnitOfWork },
    { provide: IReadingListRepository, useClass: ReadingListRepository },
    {
      provide: IReadingProgressRepository,
      useClass: ReadingProgressRepository,
    },
    { provide: ICollectionRepository, useClass: CollectionRepository },
    { provide: LibraryReadRepository, useClass: PrismaLibraryReadRepository },
    {
      provide: CollectionReadRepository,
      useClass: PrismaCollectionReadRepository,
    },
  ],
  exports: [
    IReadingListRepository,
    IReadingProgressRepository,
    ICollectionRepository,
    LibraryReadRepository,
    CollectionReadRepository,
    UnitOfWorkPort,
  ],
})
export class LibraryRepositoryModule {}
