import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { ReadingRoomReferencePort } from '../../application/public-api/reading-room-reference.port';
import { ReadingRoomReferenceAdapter } from './reading-room-reference.adapter';

@Module({
  imports: [PostgresDatabaseModule],
  providers: [
    ReadingRoomReferenceAdapter,
    {
      provide: ReadingRoomReferencePort,
      useExisting: ReadingRoomReferenceAdapter,
    },
  ],
  exports: [ReadingRoomReferencePort],
})
export class ReadingRoomsReferenceModule {}
