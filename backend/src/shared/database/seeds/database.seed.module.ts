import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Author, AuthorSchema } from '@/src/modules/authors/schemas/author.schema';
import { Book, BookSchema } from '@/src/modules/books/schemas/book.schema';
import { Genre, GenreSchema } from '@/src/modules/genres/schemas/genre.schema';
import { Comment, CommentSchema } from '@/src/modules/comments/schemas/comment.schema';
import { Chapter, ChapterSchema } from '@/src/modules/chapters/schemas/chapter.schema';

import { AuthorsSeed } from './authors.seeder';
import { GenresSeed } from './genres.seeder';
import { BooksSeed } from './books.seeder';
import { CommentsSeed } from './comments.seeder';
import { ChaptersSeed } from './chapters.seeder';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    // Cần import ConfigModule để sử dụng ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Kết nối MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/socialbook'),
      }),
      inject: [ConfigService],
    }),
    // Register các schema
    MongooseModule.forFeature([
      { name: Author.name, schema: AuthorSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: Book.name, schema: BookSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
  ],
  providers: [
    AuthorsSeed,
    GenresSeed, 
    BooksSeed,
    CommentsSeed,
    ChaptersSeed,
    SeederService,
  ],
  exports: [
    AuthorsSeed,
    GenresSeed,
    BooksSeed,
    CommentsSeed,
    ChaptersSeed,
    SeederService,
  ],
})
export class DatabaseSeedModule {}