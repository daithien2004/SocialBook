import { Comment, CommentSchema } from '@/src/modules/comments/schemas/comment.schema';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { UsersModule } from '../users/users.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { PostsModule } from '../posts/posts.module';
import { BooksModule } from '../books/books.module';
import { CommentsRepository } from './comments.repository';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
    ]),
    forwardRef(() => LikesModule),
    ContentModerationModule,
    NotificationsModule,
    PostsModule,
    UsersModule,
    ChaptersModule,
    BooksModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
  exports: [
    MongooseModule,
    CommentsService,
    CommentsRepository,
  ],
})
export class CommentsModule { }
