import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from '@/src/modules/posts/schemas/post.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
