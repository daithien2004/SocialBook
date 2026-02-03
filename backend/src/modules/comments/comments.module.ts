import { DataAccessModule } from '@/src/data-access/data-access.module';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { forwardRef, Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    DataAccessModule,
    forwardRef(() => LikesModule),
    ContentModerationModule,
    NotificationsModule,
    PostsModule,
    UsersModule,
    ChaptersModule,
    BooksModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [
    CommentsService,
  ],
})
export class CommentsModule { }
