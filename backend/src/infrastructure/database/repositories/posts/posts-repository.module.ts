import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from '@/infrastructure/database/schemas/post.schema';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { PostRepository } from './post.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  providers: [
    {
      provide: IPostRepository,
      useClass: PostRepository,
    },
  ],
  exports: [
    IPostRepository,
    MongooseModule,
  ],
})
export class PostsRepositoryModule {}
