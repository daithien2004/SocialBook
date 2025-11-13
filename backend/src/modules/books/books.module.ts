import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema';
import { Author, AuthorSchema } from '../authors/schemas/author.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Comment.name, schema: CommentSchema },

    ]),
  ],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [BooksService, MongooseModule],
})
export class BooksModule { }
