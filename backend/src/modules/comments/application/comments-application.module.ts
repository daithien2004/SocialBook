import { Module } from '@nestjs/common';
import { CreateCommentHandler } from './commands/create-comment/create-comment.handler';
import { DeleteCommentHandler } from './commands/delete-comment/delete-comment.handler';
import { GetCommentsHandler } from './queries/get-comments/get-comments.handler';
import { GetCommentCountHandler } from './queries/get-comment-count/get-comment-count.handler';
import { ModerateCommentHandler } from './commands/moderate-comment/moderate-comment.handler';
import { UpdateCommentHandler } from './commands/update-comment/update-comment.handler';

import { CommentsInfrastructureModule } from '../infrastructure/comments-infrastructure.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { ContentModerationApplicationModule } from '@/modules/content-moderation/application/public-api';
import { QueueModule } from '@/infrastructure/queue/queue.module';

export const CommandHandlers = [
  CreateCommentHandler,
  DeleteCommentHandler,
  ModerateCommentHandler,
  UpdateCommentHandler,
];

export const QueryHandlers = [GetCommentsHandler, GetCommentCountHandler];

@Module({
  imports: [
    CommentsInfrastructureModule,
    IdGeneratorModule,
    ContentModerationApplicationModule,
    QueueModule,
  ],
  providers: [...CommandHandlers, ...QueryHandlers],
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
