import { Module } from '@nestjs/common';
import { PostsApplicationModule } from './application/posts/posts-application.module';
import { PostsController } from './presentation/posts/posts.controller';

@Module({
  imports: [PostsApplicationModule],
  controllers: [PostsController],
})
export class PostsModule {}
