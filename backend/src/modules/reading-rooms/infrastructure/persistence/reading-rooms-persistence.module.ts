import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import { CreateRoomStore } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import { HighlightInsightStore } from '@/modules/reading-rooms/application/ports/persistence/highlight-insight.store';
import { PrismaCreateRoomStore } from './prisma-create-room.store';
import { PrismaHighlightInsightStore } from './prisma-highlight-insight.store';
import { PrismaReadingRoomQueryRepository } from './prisma-reading-room-query.repository';
import { PrismaReadingRoomRepository } from './prisma-reading-room.repository';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    PrismaReadingRoomRepository,
    PrismaCreateRoomStore,
    PrismaReadingRoomQueryRepository,
    PrismaHighlightInsightStore,
    {
      provide: ReadingRoomRepository,
      useExisting: PrismaReadingRoomRepository,
    },
    { provide: CreateRoomStore, useExisting: PrismaCreateRoomStore },
    {
      provide: HighlightInsightStore,
      useExisting: PrismaHighlightInsightStore,
    },
    {
      provide: ReadingRoomQueryRepository,
      useExisting: PrismaReadingRoomQueryRepository,
    },
  ],
  exports: [
    ReadingRoomRepository,
    ReadingRoomQueryRepository,
    CreateRoomStore,
    HighlightInsightStore,
  ],
})
export class ReadingRoomsPersistenceModule {}
