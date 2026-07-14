import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  UserSchema,
} from '@/infrastructure/database/schemas/user.schema';
import {
  Role,
  RoleSchema,
} from '@/infrastructure/database/schemas/role.schema';
import {
  Book,
  BookSchema,
} from '@/infrastructure/database/schemas/book.schema';
import {
  Chapter,
  ChapterSchema,
} from '@/infrastructure/database/schemas/chapter.schema';
import {
  Review,
  ReviewSchema,
} from '@/infrastructure/database/schemas/review.schema';
import {
  Comment,
  CommentSchema,
} from '@/infrastructure/database/schemas/comment.schema';
import {
  Follow,
  FollowSchema,
} from '@/infrastructure/database/schemas/follow.schema';
import {
  Like,
  LikeSchema,
} from '@/infrastructure/database/schemas/like.schema';
import {
  Progress,
  ProgressSchema,
} from '@/infrastructure/database/schemas/progress.schema';
import {
  Post,
  PostSchema,
} from '@/infrastructure/database/schemas/post.schema';
import {
  Notification,
  NotificationSchema,
} from '@/infrastructure/database/schemas/notification.schema';
import {
  ToxicWordDocument,
  ToxicWordSchema,
} from '@/infrastructure/database/schemas/toxic-word.schema';

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
} from '@/infrastructure/database/schemas/reading-room.schema';
import {
  RoomCommentSchema,
  RoomCommentSchemaFactory,
} from '@/infrastructure/database/schemas/reading-room-interactions/room-comment.schema';
import {
  RoomReactionSchema,
  RoomReactionSchemaFactory,
} from '@/infrastructure/database/schemas/reading-room-interactions/room-reaction.schema';
import {
  RoomQuoteSchema,
  RoomQuoteSchemaFactory,
} from '@/infrastructure/database/schemas/reading-room-interactions/room-quote.schema';
import { ReadingRoomsSeed } from './reading-rooms.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
      { name: ToxicWordDocument.name, schema: ToxicWordSchema },
      { name: ReadingRoom.name, schema: ReadingRoomSchema },
      { name: RoomCommentSchema.name, schema: RoomCommentSchemaFactory },
      { name: RoomReactionSchema.name, schema: RoomReactionSchemaFactory },
      { name: RoomQuoteSchema.name, schema: RoomQuoteSchemaFactory },
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
