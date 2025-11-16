// src/shared/database/seeds/comments.seeder.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '@/src/modules/comments/schemas/comment.schema';
import { Book } from '@/src/modules/books/schemas/book.schema';
import { User } from '@/src/modules/users/schemas/user.schema';
import { UsersSeed } from './users.seeder';

@Injectable()
export class CommentsSeed implements OnApplicationBootstrap {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<Comment>,
        @InjectModel(Book.name) private bookModel: Model<Book>,
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async onApplicationBootstrap() {
        await this.seedComments();
    }

    async run() {
        await this.seedComments();
    }

    async seedComments() {
        await this.commentModel.deleteMany({});

        // Lấy books và users từ database
        const books = await this.bookModel.find().exec();
        const users = await this.userModel.find().exec();
        
        // ✅ KIỂM TRA DỮ LIỆU
        if (!books || books.length === 0) {
            console.log('❌ No books found for seeding comments. Please seed books first.');
            return;
        }

        if (!users || users.length === 0) {
            console.log('❌ No users found for seeding comments. Please seed users first.');
            return;
        }

        console.log(`📚 Found ${books.length} books for seeding comments`);
        console.log(`👤 Found ${users.length} users for seeding comments`);

        const comments = [
            {
                userId: users[0]._id, // User thật
                targetType: 'book',
                targetId: books[0]._id,
                content: 'This book is amazing! The character development is phenomenal.',
                likesCount: 125,
                rating: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                userId: users[1]._id, // User thật
                targetType: 'book',
                targetId: books[1]._id,
                content: 'I love the CEO romance story! Could not put it down.',
                likesCount: 42,
                rating: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                userId: users[2]._id, // User thật
                targetType: 'book',
                targetId: books[2]._id,
                content: 'Magic Academy is so immersive! The world-building is incredible.',
                likesCount: 98,
                rating: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                userId: users[3]._id, // User OAuth
                targetType: 'book',
                targetId: books[0]._id,
                content: 'As a Google user, I found this book fantastic!',
                likesCount: 56,
                rating: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await this.commentModel.insertMany(comments);
        console.log(`✅ Seed comments done! Created ${comments.length} comments with real users.`);
    }
}