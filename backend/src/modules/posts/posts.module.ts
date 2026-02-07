import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './infrastructure/schemas/post.schema';
import { PostsController } from './presentation/posts.controller';
import { PostRepository } from './infrastructure/repositories/post.repository';
import { IPostRepository } from './domain/repositories/post.repository.interface';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { BooksModule } from '../books/books.module';

// Use Cases
import { CreatePostUseCase } from './application/use-cases/create-post.use-case';
import { GetPostsUseCase } from './application/use-cases/get-posts.use-case';
import { GetPostsByUserUseCase } from './application/use-cases/get-posts-by-user.use-case';
import { GetPostUseCase } from './application/use-cases/get-post.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case';
import { RemovePostImageUseCase } from './application/use-cases/remove-post-image.use-case';
import { GetFlaggedPostsUseCase } from './application/use-cases/get-flagged-posts.use-case';
import { ApprovePostUseCase } from './application/use-cases/approve-post.use-case';
import { RejectPostUseCase } from './application/use-cases/reject-post.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    CloudinaryModule,
    ContentModerationModule,
    BooksModule,
  ],
  controllers: [PostsController],
  providers: [
    {
      provide: IPostRepository,
      useClass: PostRepository,
    },
    PostRepository, 
    
    // Use Cases
    CreatePostUseCase,
    GetPostsUseCase,
    GetPostsByUserUseCase,
    GetPostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    RemovePostImageUseCase,
    GetFlaggedPostsUseCase,
    ApprovePostUseCase,
    RejectPostUseCase,
  ],
  exports: [
    IPostRepository,
    PostRepository,
    MongooseModule, 
  ],
})
export class PostsModule {}
