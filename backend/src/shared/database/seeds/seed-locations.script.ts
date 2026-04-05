import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
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

async function seedLocations() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  
  const userModel = app.get<Model<any>>(`${User.name}Model`);

  const locations = [
    'Vietnam',
    'USA',
    'Japan',
    'Korea',
    'UK',
    'France',
    'Germany',
  ];

  const users = await userModel.find({
    $or: [{ location: null }, { location: '' }],
  });

  let updated = 0;
  for (const user of users) {
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    await userModel.updateOne({ _id: user._id }, { location: randomLocation });
    updated++;
  }

  console.log(`✅ Seeded ${updated} users with random locations`);
  await app.close();
  process.exit(0);
}

seedLocations().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
