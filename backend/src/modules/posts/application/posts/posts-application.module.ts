import { Module } from '@nestjs/common';
import { ApprovePostHandler } from './commands/approve-post/approve-post.handler';
import { CreatePostHandler } from './commands/create-post/create-post.handler';
import { DeletePostHandler } from './commands/delete-post/delete-post.handler';
import { GetFlaggedPostsHandler } from './queries/get-flagged-posts/get-flagged-posts.handler';
import { GetPostHandler } from './queries/get-post/get-post.handler';
import { GetModerationStatsHandler } from './queries/get-moderation-stats/get-moderation-stats.handler';
import { GetPostsByUserHandler } from './queries/get-posts-by-user/get-posts-by-user.handler';
import { GetPostsHandler } from './queries/get-posts/get-posts.handler';
import { RejectPostHandler } from './commands/reject-post/reject-post.handler';
import { RemovePostImageHandler } from './commands/remove-post-image/remove-post-image.handler';
import { UpdatePostHandler } from './commands/update-post/update-post.handler';
import { ProcessPostModerationHandler } from './commands/process-post-moderation/process-post-moderation.handler';
import { PostModerationService } from './services/post-moderation.service';
import { PostsRepositoryModule } from '@/modules/posts/infrastructure/repositories/posts/posts-repository.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/public-api';
import { MediaInfrastructureModule } from '@/modules/media/infrastructure/public-api';
import { ContentModerationApplicationModule } from '@/modules/content-moderation/application/public-api';
import { UsersRepositoryModule } from '@/modules/users/infrastructure/public-api';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { PostModerationQueueModule } from '@/modules/posts/infrastructure/queues/post-moderation/post-moderation.module';
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
