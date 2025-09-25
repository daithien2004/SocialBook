import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Book } from '../modules/books/schemas/book.schema';

@Injectable()
export class BooksSeed {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<Book>,
  ) {}

  async run() {
    await this.bookModel.deleteMany({}); // clear cũ

    const booksData = [
      {
        _id: new Types.ObjectId(),
        authorId: new Types.ObjectId(), // fake id, sau này map với user thật
        genre: [new Types.ObjectId(), new Types.ObjectId()],
        title: "The Dark Prince's Redemption",
        slug: "the-dark-princes-redemption",
        publishedYear: "2023",
        description:
          "In a realm where shadows dance with light, Prince Kael must confront his dark past...",
        coverUrl: "/dark-prince-fantasy-book-cover.jpg",
        status: "completed",
        tags: ["Prince", "Redemption", "Magic", "Romance", "Dark", "Fantasy", "Adventure"],
        views: 2847392,
        likes: 45821,
        isDeleted: false,
      },
      {
        _id: new Types.ObjectId(),
        authorId: new Types.ObjectId(),
        genre: [new Types.ObjectId()],
        title: "CEO's Secret Love",
        slug: "ceos-secret-love",
        publishedYear: "2024",
        description:
          "When ambitious marketing executive Mia crosses paths with the mysterious CEO...",
        coverUrl: "/modern-romance-ceo-book-cover.jpg",
        status: "published",
        tags: ["CEO", "Office Romance", "Contemporary", "Billionaire", "Enemies to Lovers"],
        views: 1234567,
        likes: 28394,
        isDeleted: false,
      },
      {
        _id: new Types.ObjectId(),
        authorId: new Types.ObjectId(),
        genre: [new Types.ObjectId()],
        title: "Magic Academy Chronicles",
        slug: "magic-academy-chronicles",
        publishedYear: "2023",
        description:
          "Join Elena as she discovers her magical abilities and navigates the challenges...",
        coverUrl: "/magic-school-fantasy-book-cover.jpg",
        status: "published",
        tags: ["Magic School", "Academy", "Friendship", "Coming of Age", "Prophecy"],
        views: 3456789,
        likes: 67234,
        isDeleted: false,
      },
    ];

    await this.bookModel.insertMany(booksData);
    console.log('✅ Seed books done!');
  }
}
