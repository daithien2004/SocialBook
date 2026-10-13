import { Module } from '@nestjs/common';
import { IReadingRoomReferencePort } from '../../application/public-api/reading-room-reference.port';
import { ReadingRoomsPostgresModule } from '../postgres/reading-rooms-postgres.module';
import { ReadingRoomReferenceAdapter } from './reading-room-reference.adapter';

@Module({
  imports: [ReadingRoomsPostgresModule],
  providers: [
    {
      provide: IReadingRoomReferencePort,
      useExisting: ReadingRoomReferenceAdapter,
    },
  ],
  exports: [IReadingRoomReferencePort],
})
export class ReadingRoomsReferenceModule {}
