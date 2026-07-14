import { Module } from '@nestjs/common';
import { ReadingRoomsController } from './reading-rooms.controller';
import { ReadingRoomsApplicationModule } from '@/application/reading-rooms/reading-rooms-application.module';

@Module({
  imports: [ReadingRoomsApplicationModule],
  controllers: [ReadingRoomsController],
})
export class ReadingRoomsPresentationModule {}
