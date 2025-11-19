import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/src/modules/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeed {
  private readonly logger = new Logger(UsersSeed.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async run() {
    try {
      this.logger.log('🌱 Seeding users...');

      const existingUsers = await this.userModel.countDocuments();
      if (existingUsers > 0) {
        this.logger.log('⏭️  Users already exist, skipping...');
        return;
      }

      const hashedPassword = await bcrypt.hash('password123', 10);

      const users = [
        {
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          isVerified: true,
          provider: 'local',
          image: 'https://i.pravatar.cc/150?img=1',
        },
        {
          username: 'john_doe',
          email: 'john@example.com',
          password: hashedPassword,
          isVerified: true,
          provider: 'local',
          image: 'https://i.pravatar.cc/150?img=2',
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          password: hashedPassword,
          isVerified: true,
          provider: 'local',
          image: 'https://i.pravatar.cc/150?img=3',
        },
        {
          username: 'mike_wilson',
          email: 'mike@example.com',
          password: hashedPassword,
          isVerified: true,
          provider: 'local',
          image: 'https://i.pravatar.cc/150?img=4',
        },
        {
          username: 'sarah_jones',
          email: 'sarah@example.com',
          password: hashedPassword,
          isVerified: true,
          provider: 'local',
          image: 'https://i.pravatar.cc/150?img=5',
        },
        {
          username: 'google_user',
          email: 'googleuser@gmail.com',
          isVerified: true,
          provider: 'google',
          providerId: 'google_123456789',
          image: 'https://i.pravatar.cc/150?img=6',
        },
      ];

      await this.userModel.insertMany(users);
      this.logger.log(`✅ Successfully seeded ${users.length} users`);
    } catch (error) {
      this.logger.error('❌ Error seeding users:', error);
      throw error;
    }
  }
}
