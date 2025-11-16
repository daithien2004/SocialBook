// src/shared/database/seeds/comments.seeder.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from '@/src/modules/comments/schemas/comment.schema';
import { Book } from '@/src/modules/books/schemas/book.schema';

@Injectable()
export class CommentsSeed implements OnApplicationBootstrap {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<Comment>,
        @InjectModel(Book.name) private bookModel: Model<Book>,
    ) { }

    async onApplicationBootstrap() {
        await this.seedComments();
    }

    async run() {
        await this.seedComments();
    }

    async seedComments() {
        await this.commentModel.deleteMany({});

        const books = await this.bookModel.find().exec();
        
        // ✅ THÊM KIỂM TRA DỮ LIỆU
        if (!books || books.length === 0) {
            console.log('❌ No books found for seeding comments. Please seed books first.');
            return;
        }

        console.log(`📚 Found ${books.length} books for seeding comments`);

        const comments = [
            {
                _id: new Types.ObjectId(),
                userId: new Types.ObjectId('507f1f77bcf86cd799439011'), // fake user ID
                targetType: 'book',
                targetId: books[0]._id,
                content: 'This book is amazing! The character development is phenomenal.',
                likesCount: 125,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new Types.ObjectId(),
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                targetType: 'book',
                targetId: books[1]._id,
                content: 'I love the CEO romance story! Could not put it down.',
                likesCount: 42,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new Types.ObjectId(),
                userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
                targetType: 'book',
                targetId: books[2]._id,
                content: 'Magic Academy is so immersive! The world-building is incredible.',
                likesCount: 98,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await this.commentModel.insertMany(comments);
        console.log(`✅ Seed comments done! Created ${comments.length} comments.`);
    }
}