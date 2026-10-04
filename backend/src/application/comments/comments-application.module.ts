import { Module } from '@nestjs/common';
import { CreateCommentHandler } from './use-cases/create-comment/create-comment.handler';
import { DeleteCommentHandler } from './use-cases/delete-comment/delete-comment.handler';
import { GetCommentsHandler } from './use-cases/get-comments/get-comments.handler';
import { GetCommentCountHandler } from './use-cases/get-comment-count/get-comment-count.handler';
import { ModerateCommentHandler } from './use-cases/moderate-comment/moderate-comment.handler';
import { UpdateCommentHandler } from './use-cases/update-comment/update-comment.handler';

import { CommentsRepositoryModule } from '@/infrastructure/database/repositories/comments/comments-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { ContentModerationApplicationModule } from '@/application/content-moderation/content-moderation-application.module';
import { QueueModule } from '@/infrastructure/queue/queue.module';

export const CommandHandlers = [
  CreateCommentHandler,
  DeleteCommentHandler,
  ModerateCommentHandler,
  UpdateCommentHandler
];

export const QueryHandlers = [
  GetCommentsHandler,
  GetCommentCountHandler
];

@Module({
  imports: [
    CommentsRepositoryModule,
    IdGeneratorModule,
    ContentModerationApplicationModule,
    QueueModule,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    CreateCommentHandler,
    DeleteCommentHandler,
    GetCommentsHandler,
    GetCommentCountHandler,
    ModerateCommentHandler,
    UpdateCommentHandler,
  ],
})
export class CommentsApplicationModule {}
