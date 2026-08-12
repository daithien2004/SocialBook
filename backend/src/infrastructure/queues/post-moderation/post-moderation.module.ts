import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  PostModerationProcessor,
  POST_MODERATION_QUEUE,
} from './post-moderation.processor';
import { PostModerationQueueAdapter } from './post-moderation-queue.adapter';
import { IPostModerationQueuePort } from '@/domain/posts/interfaces/post-moderation-queue.port';
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
  providers: [
    CheckContentUseCase,
    PostModerationProcessor,
    {
      provide: IPostModerationQueuePort,
      useClass: PostModerationQueueAdapter,
    },
  ],
  exports: [IPostModerationQueuePort],
})
export class PostModerationQueueModule {}
