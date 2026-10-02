import { NotificationsApplicationModule } from '@/application/notifications/notifications-application.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationWorker } from './notification.worker';
import { AudioWorker } from './audio.worker';
import { TtsInfrastructureModule } from '@/infrastructure/text-to-speech/tts-infrastructure.module';
import { TextToSpeechRepositoryModule } from '@/infrastructure/database/repositories/text-to-speech/text-to-speech-repository.module';
import { ReadingRoomsApplicationModule } from '@/application/reading-rooms/reading-rooms-application.module';

import { ReadingRoomGateway } from './reading-room.gateway';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('env.JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    ...(!isWorkerProcess() ? [NotificationWorker] : []),
    ...(isWorkerProcess() ? [AudioWorker] : []),
    ReadingRoomGateway,
  ],
  exports: [NotificationsService],
})
export class GatewaysModule {}
