import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly rolesSeed: RolesSeed,
    private readonly usersSeed: UsersSeed,
    private readonly reviewsSeed: ReviewsSeed,
    private readonly commentsSeed: CommentsSeed,
    private readonly followsSeed: FollowsSeed,
    private readonly likesSeed: LikesSeed,
    private readonly progressSeed: ProgressSeed,
    private readonly postsSeed: PostsSeed,
    private readonly notificationSeed: NotificationSeed,
    private readonly toxicWordsSeed: ToxicWordsSeed,
    private readonly chapterDiscussionsSeed: ChapterDiscussionsSeed,
  ) {}

  async seed() {
    try {
      this.logger.log('🎯 Starting database seeding...');

      await this.rolesSeed.run();
      await this.usersSeed.run();
      await this.postsSeed.run();
      await this.reviewsSeed.run();
      await this.commentsSeed.run();
      await this.followsSeed.run();
      await this.likesSeed.run();
      await this.progressSeed.run();
      await this.notificationSeed.run();
      await this.toxicWordsSeed.run();
      await this.chapterDiscussionsSeed.run();

      this.logger.log('✅ All seeding completed successfully!');
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  async clear() {
    try {
      this.logger.log('🗑️ Clearing all seed data...');

      await this.rolesSeed['roleModel'].deleteMany({});
      await this.usersSeed['userModel'].deleteMany({});
      await this.postsSeed['postModel'].deleteMany({});
      await this.reviewsSeed['reviewModel'].deleteMany({});
      await this.commentsSeed['commentModel'].deleteMany({});
      await this.followsSeed['followModel'].deleteMany({});
      await this.likesSeed['likeModel'].deleteMany({});
      await this.progressSeed['progressModel'].deleteMany({});
      await this.notificationSeed['notificationModel'].deleteMany({});
      await this.toxicWordsSeed['toxicWordModel'].deleteMany({});

      this.logger.log('✅ All seed data cleared!');
    } catch (error) {
      this.logger.error('❌ Clearing seed data failed:', error);
      throw error;
    }
  }
}
