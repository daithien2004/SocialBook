import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Follow,
  FollowDocument,
} from '@/infrastructure/database/schemas/follow.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';

interface FollowSeedData {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FollowsSeed {
  private readonly logger = new Logger(FollowsSeed.name);

  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('👥 Seeding follows...');

    const existingCount = await this.followModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing follows. Skipping...`,
      );
      return;
    }

    const users = await this.userModel.find();
    if (users.length < 2) {
      this.logger.error('❌ Need at least 2 users to seed follows.');
      return;
    }

    const follows: FollowSeedData[] = [];
    const pairs = new Set<string>();

    for (const user of users) {
      const others = users.filter(
        (u) => u._id.toString() !== user._id.toString(),
      );
      const numFollows = Math.min(
        Math.floor(Math.random() * 2) + 2,
        others.length,
      );
      const shuffled = [...others].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numFollows; i++) {
        const pair = [user._id.toString(), shuffled[i]._id.toString()]
          .sort()
          .join(':');
        if (!pairs.has(pair)) {
          pairs.add(pair);
          follows.push({
            userId: user._id,
            targetId: shuffled[i]._id,
            status: true,
            createdAt: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
            updatedAt: new Date(),
          });
        }
      }
    }

    await this.followModel.insertMany(follows);
    this.logger.log(`✅ Seeded ${follows.length} follows`);
  }
}
