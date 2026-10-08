import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostModerationAdapter } from './post-moderation.adapter';
import { IPostModerationPort } from '@/modules/posts/domain/posts/interfaces/post-moderation.port';
import { POST_MODERATION_QUEUE } from './post-moderation.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: POST_MODERATION_QUEUE,
    }),
  ],
  providers: [
    {
      provide: IPostModerationPort,
      useClass: PostModerationAdapter,
    },
  ],
  exports: [IPostModerationPort, BullModule],
})
export class PostModerationQueueModule {}
