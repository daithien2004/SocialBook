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
  Book,
  BookDocument,
} from '@/infrastructure/database/schemas/book.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';
import { ChapterStatus } from '@/domain/library/entities/reading-progress.entity';

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
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
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
    const chapters = await this.chapterModel.find();
    const books = await this.bookModel.find();

    if (users.length === 0 || chapters.length === 0 || books.length === 0) {
      this.logger.error('❌ Users, chapters or books not found.');
      return;
    }

    // Group chapters by bookId for quick lookup
    const chaptersByBook = new Map<string, typeof chapters>();
    for (const ch of chapters) {
      const key = ch.bookId.toString();
      if (!chaptersByBook.has(key)) chaptersByBook.set(key, []);
      chaptersByBook.get(key)!.push(ch);
    }

    const progresses: ProgressSeedData[] = [];
    const seen = new Set<string>();

    for (const user of users) {
      // --- Random reading progress (for variety) ---
      const numChapters = Math.floor(Math.random() * 8) + 3;
      const shuffledChapters = [...chapters].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numChapters, shuffledChapters.length); i++) {
        const ch = shuffledChapters[i];
        const key = `${user._id.toString()}:${ch._id.toString()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const progress = Math.floor(Math.random() * 100) + 1;
        const isCompleted = progress >= 100;

        progresses.push({
          userId: user._id,
          bookId: ch.bookId,
          chapterId: ch._id,
          progress: Math.min(progress, 100),
          timeSpent: Math.floor(Math.random() * 1800) + 60,
          status: isCompleted ? ChapterStatus.COMPLETED : ChapterStatus.READING,
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

      // --- Fully completed books (for reviews + "Đã hoàn thành" section) ---
      const completedCount = Math.floor(Math.random() * 2) + 1; // 1-2 books
      const shuffledBooks = [...books].sort(() => Math.random() - 0.5);

      for (let b = 0; b < Math.min(completedCount, shuffledBooks.length); b++) {
        const book = shuffledBooks[b];
        const bookChapters = chaptersByBook.get(book._id.toString()) || [];

        if (bookChapters.length === 0) continue;

        for (const ch of bookChapters) {
          const key = `${user._id.toString()}:${ch._id.toString()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          progresses.push({
            userId: user._id,
            bookId: book._id,
            chapterId: ch._id,
            progress: 100,
            timeSpent: Math.floor(Math.random() * 3600) + 600,
            status: ChapterStatus.COMPLETED,
            xpEarned: Math.floor(Math.random() * 100) + 50,
            pagesRead: Math.floor(Math.random() * 20) + 10,
            wordsRead: Math.floor(Math.random() * 5000) + 1000,
            lastReadAt: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
            createdAt: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
            updatedAt: new Date(),
          });
        }
      }
    }

    await this.progressModel.insertMany(progresses);
    this.logger.log(`✅ Seeded ${progresses.length} reading progress records`);
  }
}
