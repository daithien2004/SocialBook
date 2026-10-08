import { Module } from '@nestjs/common';

import { NotificationWorker } from '@/modules/notifications/infrastructure/public-api';
import { AudioWorker } from '@/modules/text-to-speech/infrastructure/public-api';
import { NotificationsApplicationModule } from '@/modules/notifications/application/public-api';
import { TextToSpeechInfrastructureModule } from '@/modules/text-to-speech/infrastructure/public-api';
import { LibraryApplicationModule } from '@/modules/library/application/public-api';
import { TargetResolutionModule } from '@/modules/target-resolution/application/public-api';
import { ChaptersRepositoryModule } from '@/modules/chapters/infrastructure/public-api';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/public-api';
import { CommentsInfrastructureModule } from '@/modules/comments';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/public-api';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { NotificationsRealtimeModule } from '@/modules/notifications/presentation/public-api';

@Module({
  imports: [
    NotificationsApplicationModule,
    NotificationsRealtimeModule,

    ChaptersRepositoryModule,
    PostsRepositoryModule,
    CommentsInfrastructureModule,
    UsersRepositoryModule,
    TextToSpeechInfrastructureModule,
    TargetResolutionModule,
    LibraryApplicationModule,
  ],
  providers: [
    ...(!isWorkerProcess() ? [NotificationWorker] : []),
    ...(isWorkerProcess() ? [AudioWorker] : []),
  ],
})
export class GatewaysModule {}
