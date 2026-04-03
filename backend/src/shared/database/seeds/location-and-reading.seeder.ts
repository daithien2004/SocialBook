import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';
import { Chapter } from '@/infrastructure/database/schemas/chapter.schema';
import { Progress } from '@/infrastructure/database/schemas/progress.schema';

@Injectable()
export class LocationAndReadingSeeder {
  private readonly logger = new Logger(LocationAndReadingSeeder.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<any>,
    @InjectModel(Progress.name) private progressModel: Model<any>,
  ) {}

  async seedLocations(): Promise<{ updated: number; message: string }> {
    const locations = [
      'Vietnam',
      'USA',
      'Japan',
      'Korea',
      'UK',
      'France',
      'Germany',
    ];
    const users = await this.userModel.find({
      $or: [{ location: null }, { location: '' }],
    });

    let updated = 0;
    for (const user of users) {
      const randomLocation =
        locations[Math.floor(Math.random() * locations.length)];
      await this.userModel.updateOne(
        { _id: user._id },
        { location: randomLocation },
      );
      updated++;
    }

    this.logger.log(`Seeded ${updated} users with random locations`);
    return {
      updated,
      message: `Seeded ${updated} users with random locations`,
    };
  }

  async seedReadingHistory(
    days: number = 30,
  ): Promise<{ createdCount: number; days: number; message: string }> {
    const users = await this.userModel.find().limit(20);
    const chapters = await this.chapterModel.find().limit(50);

    if (users.length === 0 || chapters.length === 0) {
      return {
        createdCount: 0,
        days,
        message: 'Not enough users or chapters to seed',
      };
    }

    let createdCount = 0;
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dailyReadings = Math.floor(Math.random() * 10) + 5;

      for (let j = 0; j < dailyReadings; j++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const chapter = chapters[Math.floor(Math.random() * chapters.length)];

        const timeSpent = Math.floor(Math.random() * 1800) + 60;
        const progress = Math.floor(Math.random() * 90) + 10;
        const status = progress >= 80 ? 'completed' : 'reading';

        try {
          await this.progressModel.findOneAndUpdate(
            {
              userId: user._id,
              chapterId: chapter._id,
            },
            {
              $set: {
                bookId: chapter.bookId,
                progress,
                timeSpent,
                status,
                lastReadAt: date,
              },
            },
            { upsert: true },
          );
          createdCount++;
        } catch (error) {
          continue;
        }
      }
    }

    this.logger.log(
      `Seeded ${createdCount} reading history records for ${days} days`,
    );
    return {
      createdCount,
      days,
      message: `Seeded ${createdCount} reading history records for ${days} days`,
    };
  }
}
