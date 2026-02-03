import { Post, PostSchema } from '@/src/modules/posts/schemas/post.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BooksModule } from '../books/books.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  imports: [
    CloudinaryModule,
    ContentModerationModule,
    BooksModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [
    MongooseModule,
    PostsService,
    PostsRepository,
  ],
})
export class PostsModule { }
