import { NotificationsApplicationModule } from '@/application/notifications/notifications-application.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEventHandler } from './notification-event.handler';
import { PostsRepositoryModule } from '../database/repositories/posts/posts-repository.module';
import { CommentsRepositoryModule } from '../database/repositories/comments/comments-repository.module';
import { ReadingRoomsApplicationModule } from '@/application/reading-rooms/reading-rooms-application.module';
import { ReadingRoomGateway } from './reading-room.gateway';
import { ReadingRoomPresenceService } from './reading-room-presence.service';

@Module({
  imports: [
    NotificationsApplicationModule,
    ReadingRoomsApplicationModule,
    PostsRepositoryModule,
    CommentsRepositoryModule,
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
    ReadingRoomPresenceService,
  ],
  exports: [NotificationsService],
})

export class GatewaysModule {}
