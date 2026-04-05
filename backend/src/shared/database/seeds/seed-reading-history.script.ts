import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import {
  User,
  UserSchema,
} from '@/infrastructure/database/schemas/user.schema';
import {
  Chapter,
  ChapterSchema,
} from '@/infrastructure/database/schemas/chapter.schema';
import {
  Progress,
  ProgressSchema,
} from '@/infrastructure/database/schemas/progress.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/socialbook'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
})
class SeedModule {}

async function seedReadingHistory() {
  const args = process.argv.slice(2);
  const daysArg = args.find(arg => arg.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 30;

  const app = await NestFactory.createApplicationContext(SeedModule);
  
  const userModel = app.get<Model<any>>(`${User.name}Model`);
  const chapterModel = app.get<Model<any>>(`${Chapter.name}Model`);
  const progressModel = app.get<Model<any>>(`${Progress.name}Model`);

  const users = await userModel.find().limit(20);
  const chapters = await chapterModel.find().limit(50);

  if (users.length === 0 || chapters.length === 0) {
    console.log('❌ Not enough users or chapters to seed');
    await app.close();
    process.exit(1);
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
        await progressModel.findOneAndUpdate(
          { userId: user._id, chapterId: chapter._id },
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
      } catch {
        continue;
      }
    }
  }

  console.log(`✅ Seeded ${createdCount} reading history records for ${days} days`);
  await app.close();
  process.exit(0);
}

seedReadingHistory().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
