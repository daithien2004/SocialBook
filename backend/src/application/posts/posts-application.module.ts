import { Module } from '@nestjs/common';
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
import { PostsRepositoryModule } from '@/infrastructure/database/repositories/posts/posts-repository.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { ExternalServicesModule } from '@/infrastructure/external/external-services.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';

@Module({
  imports: [
    PostsRepositoryModule,
    BooksRepositoryModule,
    ExternalServicesModule,
    ContentModerationModule,
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
  ],
})
export class PostsApplicationModule {}
