import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from '@/core/config';

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
import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';

import { ReadingRoomsSeed } from './reading-rooms.seeder';

@Module({
  imports: [
    PostgresDatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: '.env',
    }),
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
