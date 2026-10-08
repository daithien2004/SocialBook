import { Module } from '@nestjs/common';

import { ReadingRoomsInfrastructureModule } from '@/modules/reading-rooms/infrastructure/reading-rooms-infrastructure.module';
import { ReadingRoomPresenceService } from './reading-room-presence.service';

@Module({
  imports: [ReadingRoomsInfrastructureModule],
  providers: [ReadingRoomPresenceService],
  exports: [ReadingRoomPresenceService],
})
export class ReadingRoomPresenceModule {}
