import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../books/schemas/book.schema';
import { slugify } from '@/src/utils/slugify';
import { CreateChapterDto } from './dto/create-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) { }

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
  async createChapter(bookId: string, dto: CreateChapterDto, user: any) {
    // 1. Kiểm tra sách tồn tại
    const book = await this.bookModel.findById(bookId).lean();
    if (!book) throw new NotFoundException('Sách không tồn tại');

    // 2. Tính orderIndex
    const lastChapter = await this.chapterModel
      .findOne({ bookId: new Types.ObjectId(bookId) })
      .sort({ orderIndex: -1 })
      .select('orderIndex')
      .lean();

    const orderIndex = lastChapter ? lastChapter.orderIndex + 1 : 1;

    // 3. Tạo slug duy nhất trong sách
    const baseSlug = dto.slug?.trim() || slugify(dto.title);
    let slug = baseSlug;
    let counter = 1;
    while (
      await this.chapterModel.findOne({ bookId: new Types.ObjectId(bookId), slug }).lean()
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    // 4. Tạo chapter
    const createdChapter = await this.chapterModel.create({
      bookId: new Types.ObjectId(bookId),
      title: dto.title,
      slug,
      paragraphs: dto.paragraphs,
      orderIndex,
      viewsCount: 0,
    });

    // 5. Lấy lại + populate với .lean() để tránh circular refs
    const populated = await this.chapterModel
      .findById(createdChapter._id)
      .populate('bookId', 'title slug')
      .lean<{
        _id: Types.ObjectId;
        bookId: { _id: Types.ObjectId; title: string; slug: string };
        title: string;
        slug: string;
        paragraphs: { id: string; content: string }[];
        orderIndex: number;
        viewsCount: number;
        createdAt: Date;
        updatedAt: Date;
      }>();  // Use lean() + generic type for plain object (type-safe)

    if (!populated) throw new Error('Tạo chương thất bại');

    // 6. Trả về response đẹp
    return {
      id: populated._id.toString(),
      title: populated.title,
      slug: populated.slug,
      orderIndex: populated.orderIndex,
      viewsCount: populated.viewsCount,
      paragraphs: populated.paragraphs,
      book: {
        id: populated.bookId._id.toString(),
        title: populated.bookId.title,
        slug: populated.bookId.slug,
      },
      createdAt: populated.createdAt,
      updatedAt: populated.updatedAt,
    };
  }

}
