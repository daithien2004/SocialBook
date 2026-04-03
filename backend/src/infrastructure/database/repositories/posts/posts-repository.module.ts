import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Comment,
  CommentSchema,
} from '@/infrastructure/database/schemas/comment.schema';
import {
  Like,
  LikeSchema,
} from '@/infrastructure/database/schemas/like.schema';
import {
  Post,
  PostSchema,
} from '@/infrastructure/database/schemas/post.schema';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
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
  exports: [IPostRepository, MongooseModule],
})
export class PostsRepositoryModule {}
