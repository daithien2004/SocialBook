import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Comment,
  CommentSchema,
} from '@/modules/comments/infrastructure/schemas/public-api';
import {
  Like,
  LikeSchema,
} from '@/modules/likes/infrastructure/schemas/public-api';
import {
  Post,
  PostSchema,
} from '@/modules/posts/infrastructure/schemas/post.schema';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { PostRepository } from './post.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
  ],
  providers: [
    {
      provide: IPostRepository,
      useClass: PostRepository,
    },
  ],
  exports: [IPostRepository],
})
export class PostsRepositoryModule {}
