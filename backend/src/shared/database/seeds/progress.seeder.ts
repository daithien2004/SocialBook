import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Progress,
  ProgressDocument,
} from '@/infrastructure/database/schemas/progress.schema';
import {
  Chapter,
  ChapterDocument,
} from '@/infrastructure/database/schemas/chapter.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';
import { ReadingStatus } from '@/domain/library/enums/reading-status.enum';

interface ProgressSeedData {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  chapterId: Types.ObjectId;
  progress: number;
  timeSpent: number;
  status: string;
  xpEarned: number;
  pagesRead: number;
  wordsRead: number;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProgressSeed {
  private readonly logger = new Logger(ProgressSeed.name);

  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('📖 Seeding reading progress...');

    const existingCount = await this.progressModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing progress. Skipping...`,
      );
      return;
    }

    const users = await this.userModel.find();
    const chapters = await this.chapterModel.find().limit(30);

    if (users.length === 0 || chapters.length === 0) {
      this.logger.error('❌ Users or chapters not found.');
      return;
    }

    const progresses: ProgressSeedData[] = [];
    const seen = new Set<string>();

    for (const user of users) {
      const numChapters = Math.floor(Math.random() * 8) + 3;
      const shuffled = [...chapters].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numChapters, shuffled.length); i++) {
        const ch = shuffled[i];
        const key = `${user._id.toString()}:${ch._id.toString()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const progress = Math.floor(Math.random() * 100) + 1;
        const isCompleted = progress >= 80;

        progresses.push({
          userId: user._id,
          bookId: ch.bookId,
          chapterId: ch._id,
          progress: Math.min(progress, 100),
          timeSpent: Math.floor(Math.random() * 1800) + 60,
          status: isCompleted ? ReadingStatus.COMPLETED : ReadingStatus.READING,
          xpEarned: Math.floor(Math.random() * 100),
          pagesRead: Math.floor(Math.random() * 20) + 1,
          wordsRead: Math.floor(Math.random() * 5000) + 500,
          lastReadAt: new Date(
            Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
          ),
          createdAt: new Date(
            Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }
    }

    await this.progressModel.insertMany(progresses);
    this.logger.log(`✅ Seeded ${progresses.length} reading progress records`);
  }
}
