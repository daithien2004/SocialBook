import { NotificationsApplicationModule } from '@/modules/notifications/application/public-api';
import { Module } from '@nestjs/common';

import { NotificationsService } from './notifications/notifications.service';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationWorker } from './workers/notification.worker';
import { AudioWorker } from './workers/audio.worker';
import { TextToSpeechInfrastructureModule } from '@/modules/text-to-speech/infrastructure';
import { LibraryApplicationModule } from '@/modules/library/application/library/library-application.module';
import { TargetResolutionModule } from '@/modules/target-resolution/application/target-resolution/target-resolution.module';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/repositories/chapters/chapters-repository.module';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/repositories/posts/posts-repository.module';
import { CommentsInfrastructureModule } from '@/modules/comments';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/repositories/users/users-repository.module';
import { isWorkerProcess } from '@/common/utils/process-role.util';

@Module({
  imports: [
    NotificationsApplicationModule,

    ChaptersRepositoryModule,
    PostsRepositoryModule,
    CommentsInfrastructureModule,
    UsersRepositoryModule,
    TextToSpeechInfrastructureModule,
    TargetResolutionModule,
    LibraryApplicationModule,
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    ...(!isWorkerProcess() ? [NotificationWorker] : []),
    ...(isWorkerProcess() ? [AudioWorker] : []),
  ],
  exports: [NotificationsService],
})
export class GatewaysModule {}
