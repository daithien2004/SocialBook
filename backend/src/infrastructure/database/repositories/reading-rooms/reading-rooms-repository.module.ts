import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadingRoom, ReadingRoomSchema } from '../../schemas/reading-room.schema';
import { ReadingRoomRepository } from './reading-room.repository';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';

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
  ],
  exports: [IReadingRoomRepository, MongooseModule],
})
export class ReadingRoomsRepositoryModule {}
