import { forwardRef, Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '@/src/modules/comments/schemas/comment.schema';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { Post, PostSchema } from '@/src/modules/posts/schemas/post.schema';
import { Chapter, ChapterSchema } from '@/src/modules/chapters/schemas/chapter.schema';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Post.name, schema: PostSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
    forwardRef(() => LikesModule),
    ContentModerationModule,
    NotificationsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [
    MongooseModule,
    CommentsService,
  ],
})
export class CommentsModule { }
