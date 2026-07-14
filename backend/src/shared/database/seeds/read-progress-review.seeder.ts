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
export class ReadProgressReviewSeed {
  private readonly logger = new Logger(ReadProgressReviewSeed.name);

  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('📖 Seeding read progress for reviews...');

    const deleted = await this.progressModel.deleteMany({});
    if (deleted.deletedCount > 0) {
      this.logger.log(
        `🗑️ Deleted ${deleted.deletedCount} old progress records`,
      );
    }

    const users = await this.userModel.find();
    if (users.length === 0) {
      this.logger.error('❌ Users not found.');
      return;
    }

    const books = await this.bookModel.find().exec();
    if (books.length === 0) {
      this.logger.error('❌ Books not found.');
      return;
    }

    const allChapters = await this.chapterModel
      .find()
      .sort({ orderIndex: 1 })
      .exec();

    const chaptersByBook = new Map<string, ChapterDocument[]>();
    for (const ch of allChapters) {
      const key = ch.bookId.toString();
      if (!chaptersByBook.has(key)) chaptersByBook.set(key, []);
      chaptersByBook.get(key)!.push(ch);
    }

    const allProgresses: ProgressSeedData[] = [];
    const seen = new Set<string>();

    for (const user of users) {
      for (const book of books) {
        const bookChapters = chaptersByBook.get(book._id.toString()) || [];
        if (bookChapters.length === 0) continue;

        const totalChapters = bookChapters.length;
        const requiredChapters = Math.min(10, totalChapters);
        const toComplete = Math.max(0, requiredChapters);

        for (let i = 0; i < toComplete; i++) {
          const ch = bookChapters[i];
          const key = `${user._id.toString()}:${ch._id.toString()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          allProgresses.push({
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

    if (allProgresses.length > 0) {
      await this.progressModel.insertMany(allProgresses);
    }

    this.logger.log(
      `✅ Seeded ${allProgresses.length} progress records for review eligibility`,
    );
  }
}
