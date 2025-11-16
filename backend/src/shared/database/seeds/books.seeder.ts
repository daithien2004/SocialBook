// src/shared/database/seeds/books.seeder.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book } from '@/src/modules/books/schemas/book.schema';
import { Author } from '@/src/modules/authors/schemas/author.schema';
import { Genre } from '@/src/modules/genres/schemas/genre.schema';

@Injectable()
export class BooksSeed implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(Author.name) private authorModel: Model<Author>,
    @InjectModel(Genre.name) private genreModel: Model<Genre>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedBooks();
  }

  async run() {
    await this.seedBooks();
  }
  
  async seedBooks() {
    await this.bookModel.deleteMany({});

    const authors = await this.authorModel.find().exec();
    const genres = await this.genreModel.find().exec();

    // ✅ THÊM KIỂM TRA DỮ LIỆU
    if (!authors.length || !genres.length) {
      console.log('❌ No authors or genres found. Please seed authors and genres first.');
      return;
    }

    console.log(`👤 Found ${authors.length} authors and ${genres.length} genres for seeding books`);

    const books = [
      {
        _id: new Types.ObjectId(),
        authorId: authors[0]._id,
        genre: [genres[0]._id, genres[1]._id],
        title: "The Dark Prince's Redemption",
        slug: 'the-dark-princes-redemption',
        publishedYear: '2023',
        description: 'In a realm where shadows dance with light, Prince Kael must confront his dark past...',
        coverUrl: '/dark-prince-fantasy-book-cover.jpg',
        status: 'completed',
        tags: ['Prince', 'Redemption', 'Magic', 'Romance', 'Dark', 'Fantasy', 'Adventure'],
        views: 2847392,
        likes: 45821,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new Types.ObjectId(),
        authorId: authors[1]._id,
        genre: [genres[4]._id],
        title: "CEO's Secret Love",
        slug: 'ceos-secret-love',
        publishedYear: '2024',
        description: 'When ambitious marketing executive Mia crosses paths with the mysterious CEO...',
        coverUrl: '/modern-romance-ceo-book-cover.jpg',
        status: 'published',
        tags: ['CEO', 'Office Romance', 'Contemporary', 'Billionaire', 'Enemies to Lovers'],
        views: 1234567,
        likes: 28394,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new Types.ObjectId(),
        authorId: authors[2]._id,
        genre: [genres[2]._id, genres[3]._id],
        title: 'Magic Academy Chronicles',
        slug: 'magic-academy-chronicles',
        publishedYear: '2023',
        description: 'Join Elena as she discovers her magical abilities and navigates the challenges...',
        coverUrl: '/magic-school-fantasy-book-cover.jpg',
        status: 'published',
        tags: ['Magic School', 'Academy', 'Friendship', 'Coming of Age', 'Prophecy'],
        views: 3456789,
        likes: 67234,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await this.bookModel.insertMany(books);
    console.log(`✅ Seed books done! Created ${books.length} books.`);
  }
}