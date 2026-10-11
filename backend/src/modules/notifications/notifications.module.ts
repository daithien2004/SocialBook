import { Module } from '@nestjs/common';
import { NotificationsApplicationModule } from './application/notifications-application.module';
import { NotificationController } from './presentation/notification.controller';
import { NotificationsRealtimeModule } from './presentation/realtime/notifications-realtime.module';
import { NotificationsInfrastructureModule } from './infrastructure/notifications-infrastructure.module';
import { NotificationWorker } from './infrastructure/workers/notification.worker';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/public-api';
import { CommentsInfrastructureModule } from '@/modules/comments/infrastructure/public-api';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/public-api';
import { TargetResolutionModule } from '@/modules/target-resolution/application/public-api';

@Module({
  imports: [
    NotificationsApplicationModule,
    NotificationsRealtimeModule,
    NotificationsInfrastructureModule,
    PostsRepositoryModule,
    CommentsInfrastructureModule,
    UsersRepositoryModule,
    TargetResolutionModule,
  ],
  controllers: [NotificationController],
  providers: [...(isWorkerProcess() ? [NotificationWorker] : [])],
})
export class NotificationsModule {}
