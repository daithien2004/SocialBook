import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { BooksModule } from '../books/books.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';

// Domain layer imports (for interfaces and entities)
import { ICommentRepository } from './domain/repositories/comment.repository.interface';

// Infrastructure layer imports
import { CommentRepository } from './infrastructure/repositories/comment.repository';

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
    MongooseModule.forFeature([
      { name: 'Comment', schema: require('./infrastructure/schemas/comment.schema').CommentSchema }
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
  providers: [
    // Repository implementation
    {
      provide: ICommentRepository,
      useClass: CommentRepository,
    },
    // Use cases
    CreateCommentUseCase,
    GetCommentsUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    ModerateCommentUseCase,
  ],
  exports: [
    ICommentRepository,
    CreateCommentUseCase,
    GetCommentsUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    ModerateCommentUseCase,
  ],
})
export class CommentsModule {}
