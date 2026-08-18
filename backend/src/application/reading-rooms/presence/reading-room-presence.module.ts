import { Module } from '@nestjs/common';
import { ReadingRoomPresenceService } from './reading-room-presence.service';

@Module({
  providers: [ReadingRoomPresenceService],
  exports: [ReadingRoomPresenceService],
})
export class ReadingRoomPresenceModule {}
