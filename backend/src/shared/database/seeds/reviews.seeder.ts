// src/shared/database/seeds/reviews.seeder.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from '@/src/modules/books/schemas/book.schema';
import { User } from '@/src/modules/users/schemas/user.schema';
import { Review } from '@/src/modules/reviews/schemas/review.schema';

@Injectable()
export class ReviewsSeed implements OnApplicationBootstrap {
    constructor(
        @InjectModel(Review.name) private reviewModel: Model<Review>,
        @InjectModel(Book.name) private bookModel: Model<Book>,
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async onApplicationBootstrap() {
        await this.seedReviews();
    }

    async run() {
        await this.seedReviews();
    }

    async seedReviews() {
        await this.reviewModel.deleteMany({});

        // Lấy books và users từ database
        const books = await this.bookModel.find().exec();
        const users = await this.userModel.find().exec();
        
        // ✅ KIỂM TRA DỮ LIỆU
        if (!books || books.length === 0) {
            console.log('❌ No books found for seeding reviews. Please seed books first.');
            return;
        }

        if (!users || users.length === 0) {
            console.log('❌ No users found for seeding reviews. Please seed users first.');
            return;
        }

        console.log(`📚 Found ${books.length} books for seeding reviews`);
        console.log(`👤 Found ${users.length} users for seeding reviews`);

        const reviews = [
            {
                userId: users[0]._id,
                bookId: books[0]._id,
                content: 'This book is amazing! The character development is phenomenal.',
                rating: 5,
                likesCount: 125,
                verifiedPurchase: true, // Đã mua hàng
            },
            {
                userId: users[1]._id,
                bookId: books[1]._id,
                content: 'I love the CEO romance story! Could not put it down.',
                rating: 4,
                likesCount: 42,
                verifiedPurchase: true,
            },
            {
                userId: users[2]._id,
                bookId: books[2]._id,
                content: 'Magic Academy is so immersive! The world-building is incredible.',
                rating: 5,
                likesCount: 98,
                verifiedPurchase: false, // Chưa mua hàng
            },
            {
                userId: users[3]._id,
                bookId: books[0]._id,
                content: 'As a Google user, I found this book fantastic! The plot twists were unexpected.',
                rating: 4,
                likesCount: 56,
                verifiedPurchase: true,
            },
            {
                userId: users[0]._id,
                bookId: books[3]?._id || books[0]._id, // Fallback nếu books[3] không tồn tại
                content: 'The fantasy elements in this book are well-crafted and engaging.',
                rating: 4,
                likesCount: 33,
                verifiedPurchase: true,
            },
            {
                userId: users[1]._id,
                bookId: books[4]?._id || books[1]._id,
                content: 'Romance was good but the ending felt rushed. Still enjoyed it overall.',
                rating: 3,
                likesCount: 27,
                verifiedPurchase: false,
            },
        ];

        try {
            await this.reviewModel.insertMany(reviews);
            console.log(`✅ Seed reviews done! Created ${reviews.length} reviews with real users.`);
        } catch (error) {
            // Xử lý lỗi duplicate key (user đã review cùng một book)
            if (error.code === 11000) {
                console.log('⚠️ Some reviews were skipped due to duplicate user-book combinations');
                // Có thể thử insert từng cái một để bỏ qua các bản ghi trùng
                let successCount = 0;
                for (const review of reviews) {
                    try {
                        await this.reviewModel.create(review);
                        successCount++;
                    } catch (err) {
                        // Bỏ qua lỗi duplicate
                    }
                }
                console.log(`✅ Seed reviews done! Created ${successCount} reviews.`);
            } else {
                throw error;
            }
        }
    }
}