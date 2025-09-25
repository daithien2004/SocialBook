import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Chapter, ChapterDocument } from '../modules/chapters/schemas/chapter.schema';
import { Book, BookDocument } from '../modules/books/schemas/book.schema';

@Injectable()
export class ChaptersSeed {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) { }

  async run() {
    await this.chapterModel.deleteMany({}); // clear cũ

    const books = await this.bookModel.find();
    if (!books.length) {
      console.log('⚠️ Không có book nào để tạo chapter. Seed Book trước.');
      return;
    }

    const chaptersData: Partial<Chapter>[] = [];

    // Book 1: The Dark Prince's Redemption
    const book1 = books.find(b => b.slug === 'the-dark-princes-redemption');
    if (book1) {
      chaptersData.push(
        {
          bookId: book1._id as Types.ObjectId, // ✅ dùng trực tiếp
          title: 'Chapter 1: Shadows of the Past',
          content: `
Prince Kael stood at the edge of the battlefield, the moonlight casting long shadows across the ruins...
          `,
          orderIndex: 1,
        },
        {
          bookId: book1._id as Types.ObjectId,
          title: 'Chapter 2: The Warrior’s Oath',
          content: `
Lyra tightened the leather straps of her armor, her gaze sharp as steel...
          `,
          orderIndex: 2,
        },
      );
    }

    // Book 2: CEO's Secret Love
    const book2 = books.find(b => b.slug === 'ceos-secret-love');
    if (book2) {
      chaptersData.push(
        {
          bookId: book2._id as Types.ObjectId,
          title: 'Chapter 1: A Chance Encounter',
          content: `
Mia adjusted her blazer as she stepped into the boardroom, her heart racing...
          `,
          orderIndex: 1,
        },
        {
          bookId: book2._id as Types.ObjectId,
          title: 'Chapter 2: Behind Closed Doors',
          content: `
Late at night, Alexander poured himself a glass of whiskey in his penthouse office...
          `,
          orderIndex: 2,
        },
      );
    }

    // Book 3: Magic Academy Chronicles
    const book3 = books.find(b => b.slug === 'magic-academy-chronicles');
    if (book3) {
      chaptersData.push(
        {
          bookId: book3._id as Types.ObjectId,
          title: 'Chapter 1: The Awakening',
          content: `
Elena’s hands trembled as sparks of blue fire danced across her fingertips...
          `,
          orderIndex: 1,
        },
        {
          bookId: book3._id as Types.ObjectId,
          title: 'Chapter 2: Secrets of Arcanum',
          content: `
The library of Arcanum Academy stretched beyond sight, filled with ancient tomes bound in leather and magic...
          `,
          orderIndex: 2,
        },
      );
    }

    await this.chapterModel.insertMany(chaptersData);
    console.log('✅ Seed chapters done!');
  }
}
