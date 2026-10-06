import { NotificationsApplicationModule } from '@/application/notifications/notifications-application.module';
import { Module } from '@nestjs/common';

import { NotificationsService } from './notifications/notifications.service';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationWorker } from './workers/notification.worker';
import { AudioWorker } from './workers/audio.worker';
import { TtsInfrastructureModule } from '@/infrastructure/text-to-speech/tts-infrastructure.module';
import { TextToSpeechRepositoryModule } from '@/infrastructure/database/repositories/text-to-speech/text-to-speech-repository.module';
import { ReadingRoomsApplicationModule } from '@/application/reading-rooms/reading-rooms-application.module';

import { ReadingRoomGateway } from './reading-room/reading-room.gateway';
import { WsAuthService } from './core/ws-auth.service';
import { ReadingRoomPresenceCoordinator } from './reading-room/reading-room-presence.coordinator';
import { ReadingProgressTracker } from './reading-room/reading-progress.tracker';
import { ReadingRoomHighlightHandler } from './reading-room/reading-room-highlight.handler';
import { WsRoomGuard } from './core/ws-room.guard';
import { WsThrottleGuard } from './core/ws-throttle.guard';
import { WsRateLimiter } from './core/ws-rate-limiter.service';
import { ReadingRoomEmitter } from './reading-room/reading-room.emitter';
import { ReadingRoomSystemListener } from './reading-room/reading-room-system.listener';
import { ReadingRoomConnectionHandler } from './reading-room/reading-room-connection.handler';
import { ReadingRoomNamespaceProvider } from './reading-room/reading-room.namespace-provider';
import { ReadingRoomPresenceModule } from '@/application/reading-rooms/presence/reading-room-presence.module';
import { LibraryApplicationModule } from '@/application/library/library-application.module';
import { TargetResolutionModule } from '@/application/target-resolution/target-resolution.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { CommentsRepositoryModule } from '@/infrastructure/database/repositories/comments/comments-repository.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { isWorkerProcess } from '@/common/utils/process-role.util';

@Module({
  imports: [
    NotificationsApplicationModule,
    ReadingRoomsApplicationModule,

    ChaptersRepositoryModule,
    PostsRepositoryModule,
    CommentsRepositoryModule,
    UsersRepositoryModule,
    TextToSpeechRepositoryModule,
    TtsInfrastructureModule,
    TargetResolutionModule,
    ReadingRoomPresenceModule,
    LibraryApplicationModule,
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    ...(!isWorkerProcess() ? [NotificationWorker] : []),
    ...(isWorkerProcess() ? [AudioWorker] : []),
    ReadingRoomGateway,
    WsAuthService,
    ReadingRoomPresenceCoordinator,
    ReadingProgressTracker,
    ReadingRoomHighlightHandler,
    WsRoomGuard,
    WsThrottleGuard,
    WsRateLimiter,
    ReadingRoomEmitter,
    ReadingRoomSystemListener,
    ReadingRoomConnectionHandler,
    ReadingRoomNamespaceProvider,
  ],
  exports: [NotificationsService],
})
export class GatewaysModule {}
