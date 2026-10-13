import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { PrismaUnitOfWork } from '@/core/database/postgres/prisma-unit-of-work';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import { ICreateRoomStore } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import { IHighlightInsightStore } from '@/modules/reading-rooms/application/ports/persistence/highlight-insight.store';
import { ReadingRoomReferenceAdapter } from '../integrations/reading-room-reference.adapter';
import { ReadingRoomCreateStore } from './reading-room-create.store';
import { HighlightInsightStore } from './highlight-insight.store';
import { ReadingRoomReadRepository } from './reading-room-read.repository';
import { ReadingRoomRepository } from './reading-room.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    ReadingRoomRepository,
    { provide: UnitOfWorkPort, useExisting: PrismaUnitOfWork },
    ReadingRoomCreateStore,
    ReadingRoomReadRepository,
    HighlightInsightStore,
    ReadingRoomReferenceAdapter,
    { provide: IReadingRoomRepository, useExisting: ReadingRoomRepository },
    { provide: ICreateRoomStore, useExisting: ReadingRoomCreateStore },
    { provide: IHighlightInsightStore, useExisting: HighlightInsightStore },
    {
      provide: IReadingRoomReadRepository,
      useExisting: ReadingRoomReadRepository,
    },
  ],
  exports: [
    IReadingRoomRepository,
    IReadingRoomReadRepository,
    ICreateRoomStore,
    IHighlightInsightStore,
    ReadingRoomReferenceAdapter,
    UnitOfWorkPort,
  ],
})
export class ReadingRoomsPostgresModule {}
