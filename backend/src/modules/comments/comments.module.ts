import { Module, forwardRef } from '@nestjs/common';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { BooksModule } from '../books/books.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { PostsInfrastructureModule } from '../posts/infrastructure/posts.infrastructure.module';
import { UsersModule } from '../users/users.module';
import { CommentsInfrastructureModule } from './infrastructure/comments.infrastructure.module';

// Application layer imports - Use Cases
import { CreateCommentUseCase } from './application/use-cases/create-comment/create-comment.use-case';
import { GetCommentsUseCase } from './application/use-cases/get-comments/get-comments.use-case';
import { UpdateCommentUseCase } from './application/use-cases/update-comment/update-comment.use-case';
import { DeleteCommentUseCase } from './application/use-cases/delete-comment/delete-comment.use-case';
import { ModerateCommentUseCase } from './application/use-cases/moderate-comment/moderate-comment.use-case';

// Presentation layer imports
import { CommentsController } from './presentation/comments.controller';

@Module({
  imports: [
    CommentsInfrastructureModule,
    forwardRef(() => LikesModule),
    ContentModerationModule,
    NotificationsModule,
    PostsInfrastructureModule, // Use Infrastructure Module to break circular dependency
    UsersModule,
    ChaptersModule,
    BooksModule,
  ],
  controllers: [CommentsController],
  providers: [
    // Use cases
    CreateCommentUseCase,
    GetCommentsUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    ModerateCommentUseCase,
  ],
  exports: [
    CommentsInfrastructureModule,
    CreateCommentUseCase,
    GetCommentsUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    ModerateCommentUseCase,
  ],
})
export class CommentsModule {}
