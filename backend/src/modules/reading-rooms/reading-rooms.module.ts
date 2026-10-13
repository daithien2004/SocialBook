import { Module } from '@nestjs/common';

import { CreateRoomHandler } from './application/commands/create-room/create-room.handler';
import { JoinRoomHandler } from './application/commands/join-room/join-room.handler';
import { LeaveRoomHandler } from './application/commands/leave-room/leave-room.handler';
import { ReactivateRoomHandler } from './application/commands/reactivate-room/reactivate-room.handler';
import { AddHighlightHandler } from './application/commands/add-highlight/add-highlight.handler';
import { GenerateHighlightInsightHandler } from './application/commands/generate-highlight-insight/generate-highlight-insight.handler';
import { RemoveHighlightHandler } from './application/commands/remove-highlight/remove-highlight.handler';
import { GetMyActiveRoomsHandler } from './application/queries/get-my-active-rooms/get-my-active-rooms.handler';
import { GetMyHistoryHandler } from './application/queries/get-my-history/get-my-history.handler';
import { GetRoomByCodeHandler } from './application/queries/get-room-by-code/get-room-by-code.handler';
import { GetRoomHighlightsHandler } from './application/queries/get-room-highlights/get-room-highlights.handler';
import { GetCurrentRoomChapterHandler } from './application/queries/get-current-room-chapter/get-current-room-chapter.handler';
import { ReadingRoomsInfrastructureModule } from './infrastructure/reading-rooms-infrastructure.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { AIApplicationModule } from '@/modules/ai/application/public-api';
import { ReadingRoomsController } from './presentation/http/reading-rooms.controller';
import { WsAuthService } from './presentation/websocket/core/ws-auth.service';
import { WsRateLimiter } from './presentation/websocket/core/ws-rate-limiter.service';
import { WsRoomGuard } from './presentation/websocket/core/ws-room.guard';
import { WsThrottleGuard } from './presentation/websocket/core/ws-throttle.guard';
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
    ReadingRoomsInfrastructureModule,
    BooksRepositoryModule,
    ChaptersRepositoryModule,
    AIApplicationModule,
  ],
  controllers: [ReadingRoomsController],
  providers: [
    ReadingRoomGateway,
    ReadingRoomConnectionHandler,
    ReadingRoomHighlightHandler,
    ReadingRoomPresenceCoordinator,
    ReadingRoomEmitter,
    ReadingRoomSystemListener,
    ReadingRoomNamespaceProvider,
    UserOperationLock,
    WsAuthService,
    WsRoomGuard,
    WsThrottleGuard,
    WsRateLimiter,
    CreateRoomHandler,
    JoinRoomHandler,
    LeaveRoomHandler,
    ReactivateRoomHandler,
    AddHighlightHandler,
    GenerateHighlightInsightHandler,
    RemoveHighlightHandler,
    GetMyActiveRoomsHandler,
    GetMyHistoryHandler,
    GetRoomByCodeHandler,
    GetRoomHighlightsHandler,
    GetCurrentRoomChapterHandler,
  ],
})
export class ReadingRoomsModule {}
