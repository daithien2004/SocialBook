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
import { GetRoomHighlightHandler } from './application/queries/get-room-highlight/get-room-highlight.handler';
import { GetCurrentRoomChapterHandler } from './application/queries/get-current-room-chapter/get-current-room-chapter.handler';
import { ReadingRoomsInfrastructureModule } from './infrastructure/reading-rooms-infrastructure.module';
import { BooksReadingRoomsIntegrationModule } from '@/modules/books';
import { ChaptersReadingRoomsIntegrationModule } from '@/modules/chapters';
import { AIApplicationModule } from '@/modules/ai';
import { ReadingRoomsController } from './presentation/http/reading-rooms.controller';
import { WsAuthService } from './presentation/websocket/core/ws-auth.service';
import { WsRateLimiter } from './presentation/websocket/core/ws-rate-limiter.service';
import { WsRoomGuard } from './presentation/websocket/core/ws-room.guard';
import { WsThrottleGuard } from './presentation/websocket/core/ws-throttle.guard';
import { ReadingRoomConnectionHandler } from './presentation/websocket/reading-room-connection.handler';
import { ReadingRoomEmitter } from './presentation/websocket/reading-room.emitter';
import { ReadingRoomGateway } from './presentation/websocket/reading-room.gateway';
import { ReadingRoomRealtimeListener } from './presentation/websocket/reading-room-realtime.listener';
import { ReadingRoomHighlightHandler } from './presentation/websocket/reading-room-highlight.handler';
import { ReadingRoomNamespaceProvider } from './presentation/websocket/reading-room.namespace-provider';
import { ReadingRoomPresenceCoordinator } from './presentation/websocket/reading-room-presence.coordinator';
import { ReadingRoomSystemListener } from './presentation/websocket/reading-room-system.listener';
import { UserOperationLock } from './presentation/websocket/user-operation-lock';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { defineReadingRoomAbilities } from './application/policies/reading-room.ability';

@Module({
  imports: [
    ReadingRoomsInfrastructureModule,
    BooksReadingRoomsIntegrationModule,
    ChaptersReadingRoomsIntegrationModule,
    AIApplicationModule,
  ],
  controllers: [ReadingRoomsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([defineReadingRoomAbilities]),
    },
    PoliciesGuard,
    ReadingRoomGateway,
    ...(isWorkerProcess() ? [ReadingRoomRealtimeListener] : []),
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
    GetRoomHighlightHandler,
    GetCurrentRoomChapterHandler,
  ],
})
export class ReadingRoomsModule {}
