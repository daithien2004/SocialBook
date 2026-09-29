import { Module } from '@nestjs/common';

import { PostModerationProcessor } from '@/infrastructure/queues/post-moderation/post-moderation.processor';
import { PostModerationQueueModule } from '@/infrastructure/queues/post-moderation/post-moderation.module';
import { isWorkerProcess } from '@/common/utils/process-role.util';
import { PostsApplicationModule } from './posts-application.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';

@Module({
  imports: [PostsApplicationModule, PostModerationQueueModule, PostsRepositoryModule],
  providers: [...(isWorkerProcess() ? [PostModerationProcessor] : [])],
})
export class PostModerationApplicationModule {}
