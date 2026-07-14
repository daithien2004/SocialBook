import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/infrastructure/database/schemas/user.schema';
import { Role } from '@/infrastructure/database/schemas/role.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeed {
  private readonly logger = new Logger(UsersSeed.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
  ) {}

  async run() {
    return this.seedUsers();
  }

  async seedUsers() {
    await this.userModel.deleteMany({});

    const adminRole = await this.roleModel.findOne({ name: 'admin' });
    const userRole = await this.roleModel.findOne({ name: 'user' });

    if (!adminRole || !userRole) {
      throw new Error('Roles not found! Hãy chạy RolesSeed trước.');
    }

    const hashedPassword = await bcrypt.hash('Admin2004@', 10);

    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image: '/user1.png',
        location: 'Vietnam',
        roleId: adminRole._id,
      },
      {
        username: 'lyhung',
        email: 'lyhung10nctlop95@gmail.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image: '/user2.jpg',
        location: 'Vietnam',
        roleId: adminRole._id,
      },
      {
        username: 'thien',
        email: 'thien@example.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image: '/user3.jpg',
        location: 'USA',
        roleId: userRole._id,
      },
      {
        username: 'vinh',
        email: 'vinh@example.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image: '/user4.jpg',
        location: 'UK',
        roleId: userRole._id,
      },
      {
        username: 'thanh',
        email: 'thanh@example.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image: '/user5.jpg',
        location: 'Japan',
        roleId: userRole._id,
      },
    ];

    const createdUsers = await this.userModel.insertMany(users);
    this.logger.log(`Seed users done! Created ${createdUsers.length} users.`);

    return createdUsers;
  }
}
