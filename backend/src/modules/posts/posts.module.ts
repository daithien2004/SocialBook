import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from '@/src/modules/posts/schemas/post.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BooksModule } from '../books/books.module';
import { Book, BookSchema } from '../books/schemas/book.schema';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
