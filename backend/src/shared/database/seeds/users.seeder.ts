import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/infrastructure/database/schemas/user.schema';
import { Role } from '@/infrastructure/database/schemas/role.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeed {
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
        image: 'https://cdn-icons-png.flaticon.com/512/9131/9131529.png',
        location: 'Vietnam',
        roleId: adminRole._id,
      },
      {
        username: 'lyhung',
        email: 'lyhung10nctlop95@gmail.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image:
          'https://t4.ftcdn.net/jpg/09/74/99/11/360_F_974991185_UffDpZ0MV6MvJ75h8yik3AMSlVDKrHBy.jpg',
        location: 'Vietnam',
        roleId: adminRole._id,
      },
      {
        username: 'thien',
        email: 'thien@example.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRO-FoLl1ZZbJGepB2y_8WnJpBqzqze-9wtDQ&s',
        location: 'USA',
        roleId: userRole._id,
      },
      {
        username: 'vinh',
        email: 'vinh@example.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image:
          'https://cellphones.com.vn/sforum/wp-content/uploads/2024/02/anh-avatar-ngau-40.jpg',
        location: 'UK',
        roleId: userRole._id,
      },
      {
        username: 'thanh',
        email: 'thanh@example.com',
        password: hashedPassword,
        isVerified: true,
        provider: 'local',
        image:
          'https://www.shutterstock.com/image-vector/vector-funny-cat-glasses-cute-600nw-2313634279.jpg',
        location: 'Japan',
        roleId: userRole._id,
      },
    ];

    const createdUsers = await this.userModel.insertMany(users);
    console.log(`✅ Seed users done! Created ${createdUsers.length} users.`);

    return createdUsers;
  }
}
