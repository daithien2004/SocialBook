import { DataAccessModule } from '@/src/data-access/data-access.module';
import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ContentModerationModule } from '../content-moderation/content-moderation.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    DataAccessModule,
    CloudinaryModule,
    ContentModerationModule,
    BooksModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [
    PostsService,
  ],
})
export class PostsModule { }
