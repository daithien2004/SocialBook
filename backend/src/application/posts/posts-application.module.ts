import { Module } from '@nestjs/common';
import { ApprovePostHandler } from './use-cases/approve-post.handler';
import { CreatePostHandler } from './use-cases/create-post.handler';
import { DeletePostHandler } from './use-cases/delete-post.handler';
import { GetFlaggedPostsHandler } from './use-cases/get-flagged-posts.handler';
import { GetPostHandler } from './use-cases/get-post.handler';
import { GetModerationStatsHandler } from './use-cases/get-moderation-stats.handler';
import { GetPostsByUserHandler } from './use-cases/get-posts-by-user.handler';
import { GetPostsHandler } from './use-cases/get-posts.handler';
import { RejectPostHandler } from './use-cases/reject-post.handler';
import { RemovePostImageHandler } from './use-cases/remove-post-image.handler';
import { UpdatePostHandler } from './use-cases/update-post.handler';
import { ProcessPostModerationHandler } from './use-cases/process-post-moderation.handler';
import { PostModerationService } from './services/post-moderation.service';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { MediaInfrastructureModule } from '@/infrastructure/media/media-infrastructure.module';
import { ContentModerationApplicationModule } from '../content-moderation/content-moderation-application.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { PostModerationQueueModule } from '@/infrastructure/queues/post-moderation/post-moderation.module';
import { QueueModule } from '@/infrastructure/queue/queue.module';

@Module({
  imports: [
    PostsRepositoryModule,
    BooksRepositoryModule,
    UsersRepositoryModule,
    MediaInfrastructureModule,
    ContentModerationApplicationModule,
    IdGeneratorModule,
    PostModerationQueueModule,
    QueueModule,
  ],
  providers: [
    ApprovePostHandler,
    CreatePostHandler,
    DeletePostHandler,
    GetFlaggedPostsHandler,
    GetModerationStatsHandler,
    GetPostHandler,
    GetPostsByUserHandler,
    GetPostsHandler,
    RejectPostHandler,
    RemovePostImageHandler,
    UpdatePostHandler,
    ProcessPostModerationHandler,
    PostModerationService,
  ],
  exports: [
    ApprovePostHandler,
    CreatePostHandler,
    DeletePostHandler,
    GetFlaggedPostsHandler,
    GetModerationStatsHandler,
    GetPostHandler,
    GetPostsByUserHandler,
    GetPostsHandler,
    RejectPostHandler,
    RemovePostImageHandler,
    UpdatePostHandler,
    ProcessPostModerationHandler,
    PostModerationService,
  ],
})
export class PostsApplicationModule {}
