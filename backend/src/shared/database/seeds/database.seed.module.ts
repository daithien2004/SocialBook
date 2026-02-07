import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Author,
  AuthorSchema,
} from '@/src/modules/authors/infrastructure/schemas/author.schema';
import { Book, BookSchema } from '@/src/modules/books/infrastructure/schemas/book.schema';
import { Genre, GenreSchema } from '@/src/modules/genres/infrastructure/schemas/genre.schema';
import { Review, ReviewSchema } from '@/src/modules/reviews/infrastructure/schemas/review.schema';
import { Chapter, ChapterSchema } from '@/src/modules/chapters/infrastructure/schemas/chapter.schema';
import { User, UserSchema } from '@/src/modules/users/infrastructure/schemas/user.schema';
import { Role, RoleSchema } from '@/src/modules/roles/infrastructure/schemas/role.schema';
import { TextToSpeech } from '@/src/modules/text-to-speech/domain/entities/text-to-speech.entity';
import { Post, PostSchema } from '@/src/modules/posts/infrastructure/schemas/post.schema';
import { Notification, NotificationSchema } from '@/src/modules/notifications/schemas/notification.schema';
import { Progress, ProgressSchema } from '@/src/modules/progress/schemas/progress.schema';
import { Follow, FollowSchema } from '@/src/modules/follows/infrastructure/schemas/follow.schema';
import { Like, LikeSchema } from '@/src/modules/likes/infrastructure/schemas/like.schema';
import {
  Comment,
  CommentSchema,
} from '@/src/modules/comments/infrastructure/schemas/comment.schema';

import { AuthorsSeed } from './authors.seeder';
import { GenresSeed } from './genres.seeder';
import { BooksSeed } from './books.seeder';
import { ReviewsSeed } from './reviews.seeder';
import { ChaptersSeed } from './chapters.seeder';
import { SeederService } from './seeder.service';
import { UsersSeed } from './users.seeder';
import { CommentsSeed } from './comments.seeder';
import { RolesSeed } from './roles.seed';
import { TextToSpeechSeed } from './textToSpeech.seeder';
import { TextToSpeechSchema } from '@/src/modules/text-to-speech/infrastructure/schemas/text-to-speech.schema';

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
        uri: configService.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/socialbook',
        ),
      }),
      inject: [ConfigService],
    }),
    // Register các schema
    MongooseModule.forFeature([
      { name: Author.name, schema: AuthorSchema },
      { name: Book.name, schema: BookSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: User.name, schema: UserSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Role.name, schema: RoleSchema },
      { name: TextToSpeech.name, schema: TextToSpeechSchema },
      { name: Post.name, schema: PostSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
  ],
  providers: [
    SeederService,
    AuthorsSeed,
    GenresSeed,
    BooksSeed,
    ReviewsSeed,
    ChaptersSeed,
    UsersSeed,
    CommentsSeed,
    RolesSeed,
    TextToSpeechSeed,
  ],
  exports: [SeederService],
})
export class DatabaseSeedModule { }
