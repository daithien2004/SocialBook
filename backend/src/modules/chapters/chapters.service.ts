import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { slugify } from '@/src/utils/slugify';

import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Book, BookDocument } from '../books/schemas/book.schema';

import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async findByBookSlug(bookSlug: string) {
    if (!bookSlug) throw new BadRequestException('Book slug is required');

    const book = await this.bookModel
      .findOne({ slug: bookSlug, isDeleted: false })
      .select('_id title slug')
      .lean();

    if (!book) throw new NotFoundException(`Book not found`);

    const chapters = await this.chapterModel
      .find({ bookId: book._id })
      .sort({ orderIndex: 1 })
      .select('title slug orderIndex viewsCount createdAt updatedAt paragraphs') // Chọn fields cần thiết
      .lean();

    const chaptersWithMeta = chapters.map((c) => ({
      ...c,
      paragraphsCount: c.paragraphs?.length || 0,
      paragraphs: undefined,
    }));

    return {
      book,
      total: chapters.length,
      chapters: chaptersWithMeta,
    };
  }

  async findBySlug(bookSlug: string, chapterSlug: string) {
    const book = await this.bookModel
      .findOne({ slug: bookSlug, isDeleted: false })
      .select('_id title slug')
      .lean();

    if (!book) throw new NotFoundException(`Book "${bookSlug}" not found`);

    const chapter = await this.chapterModel
      .findOne({ slug: chapterSlug, bookId: book._id })
      .lean();

    if (!chapter)
      throw new NotFoundException(`Chapter "${chapterSlug}" not found`);

    const [prevChapter, nextChapter] = await Promise.all([
      this.chapterModel
        .findOne({ bookId: book._id, orderIndex: { $lt: chapter.orderIndex } })
        .select('title slug orderIndex')
        .sort({ orderIndex: -1 })
        .lean(),
      this.chapterModel
        .findOne({ bookId: book._id, orderIndex: { $gt: chapter.orderIndex } })
        .select('title slug orderIndex')
        .sort({ orderIndex: 1 })
        .lean(),
      // Increment View (Fire & Forget, nhưng await để đảm bảo logic)
      this.chapterModel.updateOne(
        { _id: chapter._id },
        { $inc: { viewsCount: 1 } },
      ),
    ]);

    // Format Navigation data
    const navigation = {
      previous: prevChapter
        ? { title: prevChapter.title, slug: prevChapter.slug }
        : null,
      next: nextChapter
        ? { title: nextChapter.title, slug: nextChapter.slug }
        : null,
    };

    return {
      book,
      chapter: {
        ...chapter,
        viewsCount: (chapter.viewsCount || 0) + 1,
      },
      navigation,
    };
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid ID');

    const chapter = await this.chapterModel
      .findById(id)
      .populate('bookId', 'title slug')
      .lean();

    if (!chapter) throw new NotFoundException(`Chapter not found`);

    return chapter;
  }

  async create(bookSlug: string, dto: CreateChapterDto, userId: string) {
    const book = await this.bookModel
      .findOne({ slug: bookSlug, isDeleted: false })
      .select('_id')
      .lean();

    if (!book) throw new NotFoundException('Book not found');

    const lastChapter = await this.chapterModel
      .findOne({ bookId: book._id })
      .sort({ orderIndex: -1 })
      .select('orderIndex')
      .lean();

    const orderIndex = (lastChapter?.orderIndex ?? 0) + 1;

    const baseSlug = dto.slug?.trim() || slugify(dto.title);
    const slug = await this.generateUniqueSlug(book._id, baseSlug);

    const newChapter = await this.chapterModel.create({
      ...dto,
      bookId: book._id,
      title: dto.title.trim(),
      slug,
      orderIndex,
      viewsCount: 0,
    });

    return await this.chapterModel
      .findById(newChapter._id)
      .populate('bookId', 'title slug');
  }

  async update(id: string, dto: UpdateChapterDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid ID');

    const existingChapter = await this.chapterModel.findById(id);
    if (!existingChapter) throw new NotFoundException('Chapter not found');

    let slug = existingChapter.slug;
    if (dto.title && dto.title !== existingChapter.title) {
      const baseSlug = dto.slug?.trim() || slugify(dto.title);
      slug = await this.generateUniqueSlug(
        existingChapter.bookId,
        baseSlug,
        id,
      );
    }

    const updatedChapter = await this.chapterModel
      .findByIdAndUpdate(id, { ...dto, slug }, { new: true })
      .populate('bookId', 'title slug');

    return updatedChapter;
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid ID');

    const result = await this.chapterModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Chapter not found');

    return { message: 'Chapter deleted successfully' };
  }

  private async generateUniqueSlug(
    bookId: Types.ObjectId,
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query: any = { bookId, slug };
      if (excludeId) query._id = { $ne: excludeId };

      const exists = await this.chapterModel.exists(query);
      if (!exists) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}
