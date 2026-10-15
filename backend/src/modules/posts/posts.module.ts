import { Module } from '@nestjs/common';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { PostsApplicationModule } from './application/posts/posts-application.module';
import { PostsController } from './presentation/posts/posts.controller';
import { PostModerationQueueModule } from './infrastructure/queues/post-moderation/post-moderation.module';
import { PostModerationProcessor } from './infrastructure/queues/post-moderation/post-moderation.processor';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';
import { PostsRepositoryModule } from './infrastructure/repositories/posts/posts-repository.module';
import { definePostAbilities } from './application/policies/post.ability';

@Module({
  imports: [
    PostsApplicationModule,
    PostModerationQueueModule,
    PostsRepositoryModule,
  ],
  controllers: [PostsController],
  providers: [
    {
      provide: AbilityFactory,
      useFactory: () => new AbilityFactory([definePostAbilities]),
    },
    PoliciesGuard,
    ...(isWorkerProcess() ? [PostModerationProcessor] : []),
  ],
})
export class PostsModule {}
