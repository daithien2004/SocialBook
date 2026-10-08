import { Module } from '@nestjs/common';

import { PostModerationProcessor } from '@/modules/posts/infrastructure/queues/post-moderation/post-moderation.processor';
import { PostModerationQueueModule } from '@/modules/posts/infrastructure/queues/post-moderation/post-moderation.module';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { PostsApplicationModule } from './posts-application.module';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/repositories/posts/posts-repository.module';

@Module({
  imports: [
    PostsApplicationModule,
    PostModerationQueueModule,
    PostsRepositoryModule,
  ],
  providers: [...(isWorkerProcess() ? [PostModerationProcessor] : [])],
})
export class PostModerationApplicationModule {}
