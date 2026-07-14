import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  PostModerationProcessor,
  POST_MODERATION_QUEUE,
} from './post-moderation.processor';
import { ModerationInfrastructureModule } from '@/infrastructure/moderation/moderation-infrastructure.module';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';

@Module({
  imports: [
    BullModule.registerQueue({
      name: POST_MODERATION_QUEUE,
    }),
    ModerationInfrastructureModule,
    PostsRepositoryModule,
  ],
  providers: [CheckContentUseCase, PostModerationProcessor],
  exports: [
    BullModule, // Re-export để PostsApplicationModule inject Queue
  ],
})
export class PostModerationQueueModule {}
