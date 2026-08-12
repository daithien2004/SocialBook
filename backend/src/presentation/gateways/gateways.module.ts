import { NotificationsApplicationModule } from '@/application/notifications/notifications-application.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEventHandler } from './notification-event.handler';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { CommentsRepositoryModule } from '@/infrastructure/database/repositories/comments/comments-repository.module';
import { ReadingRoomsApplicationModule } from '@/application/reading-rooms/reading-rooms-application.module';
import { ReadingRoomInteractionsApplicationModule } from '@/application/reading-room-interactions/reading-room-interactions-application.module';
import { ReadingRoomGateway } from './reading-room.gateway';
import { ReadingRoomPresenceModule } from './reading-room-presence.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { ChaptersRepositoryModule } from '@/infrastructure/database/repositories/chapters/chapters-repository.module';
import { LibraryApplicationModule } from '@/application/library/library-application.module';
import { TargetResolutionModule } from '@/application/target-resolution/target-resolution.module';

@Module({
  imports: [
    NotificationsApplicationModule,
    ReadingRoomsApplicationModule,
    ReadingRoomInteractionsApplicationModule,
    PostsRepositoryModule,
    CommentsRepositoryModule,
    UsersRepositoryModule,
    ChaptersRepositoryModule,
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
    NotificationEventHandler,
    ReadingRoomGateway,
  ],
  exports: [NotificationsService],
})
export class GatewaysModule {}
