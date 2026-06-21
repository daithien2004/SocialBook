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

import { SeederService } from './seeder.service';
import { RolesSeed } from './roles.seed';
import { UsersSeed } from './users.seeder';
import { ReviewsSeed } from './reviews.seeder';
import { CommentsSeed } from './comments.seeder';
import { FollowsSeed } from './follows.seeder';
import { LikesSeed } from './likes.seeder';
import { ProgressSeed } from './progress.seeder';
import { PostsSeed } from './posts.seeder';

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
  ],
  exports: [SeederService],
})
export class DatabaseSeedModule {}
