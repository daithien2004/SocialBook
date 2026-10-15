import { Module } from '@nestjs/common';
import { CreateCommentHandler } from './commands/create-comment/create-comment.handler';
import { DeleteCommentHandler } from './commands/delete-comment/delete-comment.handler';
import { GetCommentsHandler } from './queries/get-comments/get-comments.handler';
import { GetCommentCountHandler } from './queries/get-comment-count/get-comment-count.handler';
import { ModerateCommentHandler } from './commands/moderate-comment/moderate-comment.handler';
import { UpdateCommentHandler } from './commands/update-comment/update-comment.handler';

import { CommentsInfrastructureModule } from '../infrastructure/comments-infrastructure.module';
import { IdGeneratorModule } from '@/core/database/id-generator/id-generator.module';
import { ContentModerationApplicationModule } from '@/modules/content-moderation/application/public-api';
import { NotificationsInfrastructureModule } from '@/modules/notifications/infrastructure/public-api';

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
    NotificationsInfrastructureModule,
  ],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class CommentsApplicationModule {}
