import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadingRoom, ReadingRoomSchema } from '../schemas/reading-room.schema';
import { ReadingRoomRepository } from './reading-room.repository';
import { ReadingRoomReadRepository } from './reading-room-read.repository';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/reading-room-read.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadingRoom.name, schema: ReadingRoomSchema },
    ]),
  ],
  providers: [
    {
      provide: IReadingRoomRepository,
      useClass: ReadingRoomRepository,
    },
    {
      provide: IReadingRoomReadRepository,
      useClass: ReadingRoomReadRepository,
    },
  ],
  exports: [IReadingRoomRepository, IReadingRoomReadRepository],
})
export class ReadingRoomsRepositoryModule {}
