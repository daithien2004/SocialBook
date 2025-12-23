import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from '@/src/modules/posts/schemas/post.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BooksModule } from '../books/books.module';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';

@Module({
  imports: [
    CloudinaryModule,
    ContentModerationModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [
    MongooseModule,
    PostsService,
  ],
})
export class PostsModule { }
