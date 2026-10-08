import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envConfig } from '@/config';
import {
  User,
  UserSchema,
} from '@/modules/users/infrastructure/schemas/user.schema';
import { RoleSchemaModel as Role, RoleSchema } from '@/modules/roles';
import {
  Book,
  BookSchema,
} from '@/modules/books/infrastructure/schemas/book.schema';
import {
  Chapter,
  ChapterSchema,
} from '@/modules/chapters/infrastructure/schemas/chapter.schema';
import { ReviewSchemaModel as Review, ReviewSchema } from '@/modules/reviews';
import {
  CommentSchemaModel as Comment,
  CommentSchema,
} from '@/modules/comments';
import { FollowSchemaModel as Follow, FollowSchema } from '@/modules/follows';
import { LikeSchemaModel as Like, LikeSchema } from '@/modules/likes';
import {
  Progress,
  ProgressSchema,
} from '@/modules/library/infrastructure/schemas/progress.schema';
import {
  Post,
  PostSchema,
} from '@/modules/posts/infrastructure/schemas/post.schema';
import {
  Notification,
  NotificationSchema,
} from '@/modules/notifications/infrastructure/schemas/notification.schema';
import {
  ToxicWordSchemaModel as ToxicWord,
  ToxicWordSchema,
} from '@/modules/content-moderation/infrastructure';

import { SeederService } from './seeder.service';
import { RolesSeed } from './roles.seed';
import { UsersSeed } from './users.seeder';
import { ReviewsSeed } from './reviews.seeder';
import { CommentsSeed } from './comments.seeder';
import { FollowsSeed } from './follows.seeder';
import { LikesSeed } from './likes.seeder';
import { ProgressSeed } from './progress.seeder';
import { PostsSeed } from './posts.seeder';
import { NotificationSeed } from './notifications.seeder';
import { ToxicWordsSeed } from './toxic-words.seeder';
import { ChapterDiscussionsSeed } from './chapter-discussions.seeder';
import { ReadProgressReviewSeed } from './read-progress-review.seeder';
import { PostsDiverseSeed } from './posts-diverse.seeder';
import { BookPostLikesSeed } from './book-post-likes.seeder';
import {
  ReadingRoom,
  ReadingRoomSchema,
} from '@/modules/reading-rooms/infrastructure/mongo/schemas/reading-room.schema';

import { ReadingRoomsSeed } from './reading-rooms.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/socialbook',
        ),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Post.name, schema: PostSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: ToxicWord.name, schema: ToxicWordSchema },
      { name: ReadingRoom.name, schema: ReadingRoomSchema },
    ]),
  ],
  providers: [
    SeederService,
    RolesSeed,
    UsersSeed,
    ReviewsSeed,
    CommentsSeed,
    FollowsSeed,
    LikesSeed,
    ProgressSeed,
    PostsSeed,
    NotificationSeed,
    ToxicWordsSeed,
    ChapterDiscussionsSeed,
    ReadProgressReviewSeed,
    PostsDiverseSeed,
    BookPostLikesSeed,
    ReadingRoomsSeed,
  ],
  exports: [SeederService],
})
export class DatabaseSeedModule {}
