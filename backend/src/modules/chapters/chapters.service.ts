import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../books/schemas/book.schema';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async getBookWithFirstChapterBySlug(slug: string) {
    const book = await this.bookModel.findOne({ slug }).lean();
    if (!book) throw new NotFoundException('Book not found');

    const firstChapter = await this.chapterModel
      .findOne({ bookId: book._id })
      .sort({ orderIndex: 1 })
      .lean();

    const allIndex = await this.chapterModel
      .find({ bookId: book._id })
      .select('_id orderIndex title slug') // chỉ lấy những field cần
      .sort({ orderIndex: 1 })
      .lean();

    return {
      book,
      firstChapter,
      allIndex,
    };
  }

  // Lấy chương tiếp theo theo slug + orderIndex (metadata only)
  async getNextChapterMeta(slug: string, currentOrderIndex: number) {
    const book = await this.bookModel.findOne({ slug }).lean();
    if (!book) throw new NotFoundException('Book not found');

    const nextChapter = await this.chapterModel
      .findOne(
        { bookId: book._id, orderIndex: { $gt: currentOrderIndex } },
        { _id: 1, orderIndex: 1, title: 1, slug: 1 }, // chỉ select metadata
      )
      .sort({ orderIndex: 1 })
      .lean();

    if (!nextChapter) throw new NotFoundException('Next chapter not found');
    return nextChapter;
  }

  // Khi cần content thật sự
  async getChapterContent(chapterId: string) {
    const chapter = await this.chapterModel
      .findById(chapterId, { content: 1 })
      .lean();

    if (!chapter) throw new NotFoundException('Chapter not found');
    return chapter;
  }
}
