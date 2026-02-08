import { Module } from '@nestjs/common';
import { PostsInfrastructureModule } from './infrastructure/posts.infrastructure.module';
import { PostsController } from './presentation/posts.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { BooksModule } from '../books/books.module';
import { LikesModule } from '../likes/likes.module';
import { CommentsInfrastructureModule } from '../comments/infrastructure/comments.infrastructure.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CreatePostUseCase } from './application/use-cases/create-post.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case';
import { GetPostsUseCase } from './application/use-cases/get-posts.use-case';
import { GetPostsByUserUseCase } from './application/use-cases/get-posts-by-user.use-case';
import { GetPostUseCase } from './application/use-cases/get-post.use-case';
import { RemovePostImageUseCase } from './application/use-cases/remove-post-image.use-case';
import { GetFlaggedPostsUseCase } from './application/use-cases/get-flagged-posts.use-case';
import { ApprovePostUseCase } from './application/use-cases/approve-post.use-case';
import { RejectPostUseCase } from './application/use-cases/reject-post.use-case';
@Module({
  imports: [
    PostsInfrastructureModule,
    CloudinaryModule,
    ContentModerationModule,
    BooksModule,
    LikesModule,
    CommentsInfrastructureModule, // Use Infrastructure Module to break circular dependency
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [
    // Use Cases
    CreatePostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    GetPostsUseCase,
    GetPostsByUserUseCase,
    GetPostUseCase,
    RemovePostImageUseCase,
    GetFlaggedPostsUseCase,
    ApprovePostUseCase,
    RejectPostUseCase,
  ],
  exports: [
    PostsInfrastructureModule,
    CreatePostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    GetPostsUseCase,
    GetPostsByUserUseCase,
    GetPostUseCase,
    RemovePostImageUseCase,
    GetFlaggedPostsUseCase,
    ApprovePostUseCase,
    RejectPostUseCase,
  ],
})
export class PostsModule {}
