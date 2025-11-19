import { Injectable, Logger } from '@nestjs/common';
import { AuthorsSeed } from './authors.seeder';
import { GenresSeed } from './genres.seeder';
import { BooksSeed } from './books.seeder';
import { ReviewsSeed } from './reviews.seeder';
import { ChaptersSeed } from './chapters.seeder';
import { UsersSeed } from './users.seeder';
import { CommentsSeed } from './comments.seeder';
import { RolesSeed } from './roles.seed';
@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly authorsSeed: AuthorsSeed,
    private readonly genresSeed: GenresSeed,
    private readonly booksSeed: BooksSeed,
    private readonly reviewsSeed: ReviewsSeed,
    private readonly chaptersSeed: ChaptersSeed,
    private readonly usersSeed: UsersSeed,
    private readonly commentsSeed: CommentsSeed,
    private readonly rolesSeed: RolesSeed,
  ) {}

  async seed() {
    try {
      this.logger.log('🎯 Starting database seeding...');

      // Thứ tự seeding quan trọng
      await this.rolesSeed.run();
      await this.usersSeed.run();
      await this.authorsSeed.run();
      await this.genresSeed.run();
      await this.booksSeed.run();
      await this.chaptersSeed.run();
      await this.reviewsSeed.run();
      await this.commentsSeed.run();

      this.logger.log('✅ All seeding completed successfully!');
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  async clear() {
    try {
      this.logger.log('🗑️ Clearing all seed data...');

      // Xóa theo thứ tự ngược để tránh constraint errors
      await this.rolesSeed['roleModel'].deleteMany({});
      await this.usersSeed['userModel'].deleteMany({});
      await this.reviewsSeed['reviewModel'].deleteMany({});
      await this.chaptersSeed['chapterModel'].deleteMany({});
      await this.booksSeed['bookModel'].deleteMany({});
      await this.authorsSeed['authorModel'].deleteMany({});
      await this.genresSeed['genreModel'].deleteMany({});
      await this.commentsSeed['commentModel'].deleteMany({});

      this.logger.log('✅ All seed data cleared!');
    } catch (error) {
      this.logger.error('❌ Clearing seed data failed:', error);
      throw error;
    }
  }
}
