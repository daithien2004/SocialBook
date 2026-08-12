import { Module } from '@nestjs/common';
import { ApprovePostUseCase } from './use-cases/approve-post.use-case';
import { CreatePostUseCase } from './use-cases/create-post.use-case';
import { DeletePostUseCase } from './use-cases/delete-post.use-case';
import { GetFlaggedPostsUseCase } from './use-cases/get-flagged-posts.use-case';
import { GetPostUseCase } from './use-cases/get-post.use-case';
import { GetModerationStatsUseCase } from './use-cases/get-moderation-stats.use-case';
import { GetPostsByUserUseCase } from './use-cases/get-posts-by-user.use-case';
import { GetPostsUseCase } from './use-cases/get-posts.use-case';
import { RejectPostUseCase } from './use-cases/reject-post.use-case';
import { RemovePostImageUseCase } from './use-cases/remove-post-image.use-case';
import { UpdatePostUseCase } from './use-cases/update-post.use-case';
import { ProcessPostModerationUseCase } from './use-cases/process-post-moderation.use-case';
import { PostModerationService } from './services/post-moderation.service';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { MediaInfrastructureModule } from '@/infrastructure/media/media-infrastructure.module';
import { ContentModerationApplicationModule } from '../content-moderation/content-moderation-application.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { PostModerationQueueModule } from '@/infrastructure/queues/post-moderation/post-moderation.module';

@Module({
  imports: [
    PostsRepositoryModule,
    BooksRepositoryModule,
    UsersRepositoryModule,
    MediaInfrastructureModule,
    ContentModerationApplicationModule,
    IdGeneratorModule,
    PostModerationQueueModule,
  ],
  providers: [
    ApprovePostUseCase,
    CreatePostUseCase,
    DeletePostUseCase,
    GetFlaggedPostsUseCase,
    GetModerationStatsUseCase,
    GetPostUseCase,
    GetPostsByUserUseCase,
    GetPostsUseCase,
    RejectPostUseCase,
    RemovePostImageUseCase,
    UpdatePostUseCase,
    ProcessPostModerationUseCase,
    PostModerationService,
  ],
  exports: [
    ApprovePostUseCase,
    CreatePostUseCase,
    DeletePostUseCase,
    GetFlaggedPostsUseCase,
    GetModerationStatsUseCase,
    GetPostUseCase,
    GetPostsByUserUseCase,
    GetPostsUseCase,
    RejectPostUseCase,
    RemovePostImageUseCase,
    UpdatePostUseCase,
    ProcessPostModerationUseCase,
    PostModerationService,
  ],
})
export class PostsApplicationModule {}
