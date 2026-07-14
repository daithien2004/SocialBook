import { Module } from '@nestjs/common';
import { ReadingRoomInteractionsApplicationModule } from '@/application/reading-room-interactions/reading-room-interactions-application.module';
import { ReadingRoomInteractionsController } from './reading-room-interactions.controller';

@Module({
  imports: [ReadingRoomInteractionsApplicationModule],
  controllers: [ReadingRoomInteractionsController],
})
export class ReadingRoomInteractionsPresentationModule {}
