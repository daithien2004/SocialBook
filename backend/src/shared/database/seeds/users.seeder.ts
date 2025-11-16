// src/shared/database/seeds/users.seeder.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/src/modules/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeed implements OnApplicationBootstrap {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async onApplicationBootstrap() {
        await this.seedUsers();
    }

    async run() {
        await this.seedUsers();
    }

    async seedUsers() {
        await this.userModel.deleteMany({});

        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = [
            {
                username: 'john_doe',
                email: 'john.doe@example.com',
                password: hashedPassword,
                isVerified: true,
                provider: 'local',
                image: 'https://t4.ftcdn.net/jpg/09/74/99/11/360_F_974991185_UffDpZ0MV6MvJ75h8yik3AMSlVDKrHBy.jpg',
            },
            {
                username: 'jane_smith',
                email: 'jane.smith@example.com',
                password: hashedPassword,
                isVerified: true,
                provider: 'local',
                image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRO-FoLl1ZZbJGepB2y_8WnJpBqzqze-9wtDQ&s',
            },
            {
                username: 'alex_wong',
                email: 'alex.wong@example.com',
                password: hashedPassword,
                isVerified: true,
                provider: 'local',
                image: 'https://cellphones.com.vn/sforum/wp-content/uploads/2024/02/anh-avatar-ngau-40.jpg',
            },
            {
                username: 'sarah_google',
                email: 'sarah.google@example.com',
                isVerified: true,
                provider: 'google',
                providerId: 'google123456',
                image: 'https://www.shutterstock.com/image-vector/vector-funny-cat-glasses-cute-600nw-2313634279.jpg',
            }
        ];

        const createdUsers = await this.userModel.insertMany(users);
        console.log(`✅ Seed users done! Created ${createdUsers.length} users.`);
        
        return createdUsers; // Trả về users đã tạo để sử dụng trong comment seed
    }
}