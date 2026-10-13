import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { PrismaUnitOfWork } from '@/core/database/postgres/prisma-unit-of-work';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/modules/library/domain/library/repositories/reading-progress.repository.interface';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { CollectionRepository } from './collection.repository';
import { ReadingListRepository } from './reading-list.repository';
import { ReadingProgressRepository } from './reading-progress.repository';

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
  ],
  exports: [
    IReadingListRepository,
    IReadingProgressRepository,
    ICollectionRepository,
    UnitOfWorkPort,
  ],
})
export class LibraryRepositoryModule {}
