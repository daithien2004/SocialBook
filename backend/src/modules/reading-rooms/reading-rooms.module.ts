import { Module } from '@nestjs/common';

import { ReadingRoomsApplicationModule } from './application/reading-rooms-application.module';
import { ReadingRoomPresenceModule } from './application/presence/reading-room-presence.module';
import { ReadingRoomsInfrastructureModule } from './infrastructure/reading-rooms-infrastructure.module';
import { ReadingRoomsController } from './presentation/http/reading-rooms.controller';
import { WsAuthService } from './presentation/websocket/core/ws-auth.service';
import { WsRateLimiter } from './presentation/websocket/core/ws-rate-limiter.service';
import { WsRoomGuard } from './presentation/websocket/core/ws-room.guard';
import { WsThrottleGuard } from './presentation/websocket/core/ws-throttle.guard';
import { ReadingProgressTracker } from './presentation/websocket/reading-progress.tracker';
import { ReadingRoomConnectionHandler } from './presentation/websocket/reading-room-connection.handler';
import { ReadingRoomEmitter } from './presentation/websocket/reading-room.emitter';
import { ReadingRoomGateway } from './presentation/websocket/reading-room.gateway';
import { ReadingRoomHighlightHandler } from './presentation/websocket/reading-room-highlight.handler';
import { ReadingRoomNamespaceProvider } from './presentation/websocket/reading-room.namespace-provider';
import { ReadingRoomPresenceCoordinator } from './presentation/websocket/reading-room-presence.coordinator';
import { ReadingRoomSystemListener } from './presentation/websocket/reading-room-system.listener';
import { UserOperationLock } from './presentation/websocket/user-operation-lock';

@Module({
  imports: [
    ReadingRoomsApplicationModule,
    ReadingRoomPresenceModule,
    ReadingRoomsInfrastructureModule,
  ],
  controllers: [ReadingRoomsController],
  providers: [
    ReadingRoomGateway,
    ReadingRoomConnectionHandler,
    ReadingRoomHighlightHandler,
    ReadingRoomPresenceCoordinator,
    ReadingProgressTracker,
    ReadingRoomEmitter,
    ReadingRoomSystemListener,
    ReadingRoomNamespaceProvider,
    UserOperationLock,
    WsAuthService,
    WsRoomGuard,
    WsThrottleGuard,
    WsRateLimiter,
  ],
})
export class ReadingRoomsModule {}
