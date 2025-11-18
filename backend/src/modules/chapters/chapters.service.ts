import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  async getChapterBySlug(bookSlug: string, chapterSlug: string) {
    // VALIDATION
    if (!bookSlug) {
      throw new BadRequestException('Book slug is required');
    }

    if (!chapterSlug) {
      throw new BadRequestException('Chapter slug is required');
    }

    // BUSINESS RULES VALIDATION
    const book = await this.bookModel
      .findOne({ slug: bookSlug, isDeleted: false })
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with slug "${bookSlug}" not found`);
    }

    // EXECUTION
    const chapter = await this.chapterModel
      .findOne({
        slug: chapterSlug,
        bookId: book._id,
      })
      .lean();

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with slug "${chapterSlug}" not found in book "${bookSlug}"`,
      );
    }

    // Lấy thông tin previous và next chapter dựa trên orderIndex
    const [previousChapter, nextChapter] = await Promise.all([
      this.chapterModel
        .findOne({
          bookId: book._id,
          orderIndex: { $lt: chapter.orderIndex },
        })
        .select('title slug orderIndex')
        .sort({ orderIndex: -1 })
        .lean(),
      this.chapterModel
        .findOne({
          bookId: book._id,
          orderIndex: { $gt: chapter.orderIndex },
        })
        .select('title slug orderIndex')
        .sort({ orderIndex: 1 })
        .lean(),
    ]);

    // SIDE EFFECTS - Tăng viewsCount
    await this.chapterModel.updateOne(
      { _id: chapter._id },
      { $inc: { viewsCount: 1 } },
    );

    // RETURN
    return {
      book: {
        id: book._id,
        title: book.title,
        slug: book.slug,
      },
      chapter: {
        id: chapter._id,
        title: chapter.title,
        slug: chapter.slug,
        orderIndex: chapter.orderIndex,
        paragraphs: chapter.paragraphs,
        viewsCount: chapter.viewsCount + 1,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      },
      navigation: {
        previous: previousChapter
          ? {
              id: previousChapter._id,
              title: previousChapter.title,
              slug: previousChapter.slug,
              orderIndex: previousChapter.orderIndex,
            }
          : null,
        next: nextChapter
          ? {
              id: nextChapter._id.toString(),
              title: nextChapter.title,
              slug: nextChapter.slug,
              orderIndex: nextChapter.orderIndex,
            }
          : null,
      },
    };
  }

  async getChaptersByBookSlug(bookSlug: string) {
    // VALIDATION
    if (!bookSlug) {
      throw new BadRequestException('Book slug is required');
    }

    const book = await this.bookModel
      .findOne({ slug: bookSlug, isDeleted: false })
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with ID "${bookSlug}" not found`);
    }

    // EXECUTION
    const chapters = await this.chapterModel
      .find({ bookId: book._id })
      .select('title slug orderIndex viewsCount createdAt updatedAt')
      .sort({ orderIndex: 1 })
      .lean();

    // RETURN
    return {
      book: {
        id: book._id,
        title: book.title,
        slug: book.slug,
      },
      total: chapters.length,
      chapters: chapters.map((chapter) => ({
        id: chapter._id,
        title: chapter.title,
        slug: chapter.slug,
        orderIndex: chapter.orderIndex,
        viewsCount: chapter.viewsCount,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      })),
    };
  }
}
