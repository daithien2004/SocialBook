import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  PostModerationProcessor,
  POST_MODERATION_QUEUE,
} from './post-moderation.processor';
import { PostModerationAdapter } from './post-moderation.adapter';
import { IPostModerationPort } from '@/domain/posts/interfaces/post-moderation.port';

import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { ContentModerationApplicationModule } from '@/application/content-moderation/content-moderation-application.module';
import { PostsApplicationModule } from '@/application/posts/posts-application.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: POST_MODERATION_QUEUE,
    }),
    forwardRef(() => PostsApplicationModule),

    PostsRepositoryModule,
    ContentModerationApplicationModule,
  ],
  providers: [
    PostModerationProcessor,
    {
      provide: IPostModerationPort,
      useClass: PostModerationAdapter,
    },
  ],
  exports: [IPostModerationPort],
})
export class PostModerationQueueModule {}
