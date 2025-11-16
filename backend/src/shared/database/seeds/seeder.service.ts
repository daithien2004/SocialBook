import { Injectable, Logger } from '@nestjs/common';
import { AuthorsSeed } from './authors.seeder';
import { GenresSeed } from './genres.seeder';
import { BooksSeed } from './books.seeder';
import { CommentsSeed } from './comments.seeder';
import { ChaptersSeed } from './chapters.seeder';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly authorsSeed: AuthorsSeed,
    private readonly genresSeed: GenresSeed,
    private readonly booksSeed: BooksSeed,
    private readonly commentsSeed: CommentsSeed,
    private readonly chaptersSeed: ChaptersSeed,
  ) {}

  async seed() {
    try {
      this.logger.log('🎯 Starting database seeding...');

      // Thứ tự seeding quan trọng
      await this.authorsSeed.run();
      await this.genresSeed.run();
      await this.booksSeed.run();
      await this.chaptersSeed.run();
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
      await this.commentsSeed['commentModel'].deleteMany({});
      await this.chaptersSeed['chapterModel'].deleteMany({});
      await this.booksSeed['bookModel'].deleteMany({});
      await this.authorsSeed['authorModel'].deleteMany({});
      await this.genresSeed['genreModel'].deleteMany({});

      this.logger.log('✅ All seed data cleared!');
    } catch (error) {
      this.logger.error('❌ Clearing seed data failed:', error);
      throw error;
    }
  }
}