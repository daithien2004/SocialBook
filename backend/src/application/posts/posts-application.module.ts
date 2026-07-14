import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ApprovePostUseCase } from './use-cases/approve-post.use-case';
import { CreatePostUseCase } from './use-cases/create-post.use-case';
import { DeletePostUseCase } from './use-cases/delete-post.use-case';
import { GetFlaggedPostsUseCase } from './use-cases/get-flagged-posts.use-case';
import { GetPostUseCase } from './use-cases/get-post.use-case';
import { GetPostsByUserUseCase } from './use-cases/get-posts-by-user.use-case';
import { GetPostsUseCase } from './use-cases/get-posts.use-case';
import { RejectPostUseCase } from './use-cases/reject-post.use-case';
import { RemovePostImageUseCase } from './use-cases/remove-post-image.use-case';
import { UpdatePostUseCase } from './use-cases/update-post.use-case';
import { PostModerationService } from './services/post-moderation.service';
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { MediaInfrastructureModule } from '@/infrastructure/media/media-infrastructure.module';
import { ContentModerationApplicationModule } from '../content-moderation/content-moderation-application.module';
import { UsersRepositoryModule } from '@/infrastructure/database/repositories/users/users-repository.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { POST_MODERATION_QUEUE } from '@/infrastructure/queues/post-moderation/post-moderation.processor';

@Module({
  imports: [
    PostsRepositoryModule,
    BooksRepositoryModule,
    UsersRepositoryModule,
    MediaInfrastructureModule,
    ContentModerationApplicationModule,
    IdGeneratorModule,
    BullModule.registerQueue({ name: POST_MODERATION_QUEUE }),
  ],
  providers: [
    ApprovePostUseCase,
    CreatePostUseCase,
    DeletePostUseCase,
    GetFlaggedPostsUseCase,
    GetPostUseCase,
    GetPostsByUserUseCase,
    GetPostsUseCase,
    RejectPostUseCase,
    RemovePostImageUseCase,
    UpdatePostUseCase,
    PostModerationService,
  ],
  exports: [
    ApprovePostUseCase,
    CreatePostUseCase,
    DeletePostUseCase,
    GetFlaggedPostsUseCase,
    GetPostUseCase,
    GetPostsByUserUseCase,
    GetPostsUseCase,
    RejectPostUseCase,
    RemovePostImageUseCase,
    UpdatePostUseCase,
    PostModerationService,
  ],
})
export class PostsApplicationModule {}
