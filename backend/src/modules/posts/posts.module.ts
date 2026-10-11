import { Module } from '@nestjs/common';
import { PostsApplicationModule } from './application/posts/posts-application.module';
import { PostsController } from './presentation/posts/posts.controller';
import { PostModerationQueueModule } from './infrastructure/queues/post-moderation/post-moderation.module';
import { PostModerationProcessor } from './infrastructure/queues/post-moderation/post-moderation.processor';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { PostsRepositoryModule } from './infrastructure/repositories/posts/posts-repository.module';

@Module({
  imports: [
    PostsApplicationModule,
    PostModerationQueueModule,
    PostsRepositoryModule,
  ],
  controllers: [PostsController],
  providers: [...(isWorkerProcess() ? [PostModerationProcessor] : [])],
})
export class PostsModule {}
