import { slugify } from '@/src/utils/slugify';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { BooksRepository } from '../books/books.repository';
import { ChaptersRepository } from './chapters.repository';

import { ErrorMessages } from '@/src/common/constants/error-messages';
import { CacheService } from '@/src/shared/cache/cache.service';
import { formatPaginatedResponse } from '@/src/utils/helpers';
import { BookInfoModal } from '../books/modals/book.modal';
import { BookDocument } from '../books/schemas/book.schema';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ChapterListModal, ChapterModal, ChapterNavModal } from './modals/chapter.modal';

export interface ChapterDetailResult {
  book: BookInfoModal;
  chapter: ChapterModal;
  navigation: {
    previous: ChapterNavModal | null;
    next: ChapterNavModal | null;
  };
}

@Injectable()
export class ChaptersService {
  constructor(
    private readonly chaptersRepository: ChaptersRepository,
    private readonly booksRepository: BooksRepository,
    private readonly cacheService: CacheService,
  ) { }

  async findByBookSlug(bookSlug: string) {
    if (!bookSlug) throw new BadRequestException('Book slug is required');

    const book = await this.booksRepository.findBySlugSelect(bookSlug, '_id title slug');

    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    const chaptersWithTTS = await this.chaptersRepository.findChaptersWithInfo(book._id);

    return {
      book: new BookInfoModal(book),
      total: chaptersWithTTS.length,
      chapters: ChapterListModal.fromArray(chaptersWithTTS),
    };
  }

  async findBySlug(bookSlug: string, chapterSlug: string): Promise<ChapterDetailResult> {
    const cacheKey = `chapter:slug:${bookSlug}:${chapterSlug}`;
    let cachedResult = await this.cacheService.get<ChapterDetailResult>(cacheKey);

    if (cachedResult) {
      if (cachedResult.chapter?.id) {
        this.chaptersRepository.incrementViews(new Types.ObjectId(cachedResult.chapter.id));
      }
      return cachedResult;
    }

    const book = await this.booksRepository.findBySlugWithPopulate(bookSlug);

    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    const chapter = await this.chaptersRepository.findBySlug(book._id, chapterSlug);

    if (!chapter) throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);

    const [prevChapter, nextChapter] = await Promise.all([
      this.chaptersRepository.findPreviousChapter(book._id, chapter.orderIndex),
      this.chaptersRepository.findNextChapter(book._id, chapter.orderIndex),
    ]);

    this.chaptersRepository.incrementViews(chapter._id);

    const result: ChapterDetailResult = {
      book: new BookInfoModal(book),
      chapter: new ChapterModal({
        ...chapter,
        viewsCount: (chapter.viewsCount || 0) + 1,
      }),
      navigation: {
        previous: ChapterNavModal.fromChapter(prevChapter),
        next: ChapterNavModal.fromChapter(nextChapter),
      },
    };

    await this.cacheService.set(cacheKey, result, 3600);
    return result;
  }

  async getChaptersByBookSlug(bookSlug: string, page: number, limit: number) {
    if (!bookSlug?.trim()) {
      throw new BadRequestException('Book slug là bắt buộc');
    }

    const book = await this.booksRepository.findBySlugSelect(bookSlug, '_id title slug');

    if (!book) {
      throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
    }

    const skip = (page - 1) * limit;
    const totalChapters = await this.chaptersRepository.count({ bookId: book._id });
    const chapters = await this.chaptersRepository.findChaptersWithInfo(book._id, { skip, limit });
    const paginated = formatPaginatedResponse(ChapterListModal.fromArray(chapters), totalChapters, page, limit);

    return {
      book: new BookInfoModal(book),
      ...paginated,
    };
  }

  async createChapter(bookIdOrSlug: string, dto: CreateChapterDto) {
    let book: BookDocument | null;
    if (Types.ObjectId.isValid(bookIdOrSlug)) {
      book = await this.booksRepository.findById(bookIdOrSlug);
    } else {
      book = await this.booksRepository.findBySlugSelect(bookIdOrSlug, '_id');
    }

    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);
    const bookId = book._id;

    const lastChapter = await this.chaptersRepository.findLastChapter(bookId);
    const orderIndex = lastChapter ? lastChapter.orderIndex + 1 : 1;

    const baseSlug = dto.slug?.trim() || slugify(dto.title.trim());
    let slug = baseSlug;
    let counter = 1;

    while (
      await this.chaptersRepository.existsBySlug(bookId, slug)
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    const paragraphs = (dto.paragraphs || []).map((p) => ({
      content: p.content,
    }));

    const createdChapter = await this.chaptersRepository.create({
      bookId: new Types.ObjectId(bookId),
      title: dto.title.trim(),
      slug,
      paragraphs: paragraphs as any,
      orderIndex,
      viewsCount: 0,
    });

    const populated = await this.chaptersRepository.findById(createdChapter._id, 'bookId');

    if (!populated) {
      throw new InternalServerErrorException('Tạo chương thất bại');
    }

    return new ChapterModal(populated);
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const chapter = await this.chaptersRepository.findById(id, 'bookId');

    if (!chapter) throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);

    return new ChapterModal(chapter);
  }

  async create(bookSlug: string, dto: CreateChapterDto) {
    const book = await this.booksRepository.findBySlugSelect(bookSlug, '_id');

    if (!book) throw new NotFoundException(ErrorMessages.BOOK_NOT_FOUND);

    const lastChapter = await this.chaptersRepository.findLastChapter(book._id);

    const orderIndex = (lastChapter?.orderIndex ?? 0) + 1;

    const baseSlug = dto.slug?.trim() || slugify(dto.title);
    const slug = await this.generateUniqueSlug(book._id, baseSlug);

    const newChapter = await this.chaptersRepository.create({
      ...dto,
      bookId: book._id,
      title: dto.title.trim(),
      slug,
      orderIndex,
      viewsCount: 0,
    } as any);

    const populated = await this.chaptersRepository.findById(newChapter._id, 'bookId');
    return new ChapterModal(populated!);
  }

  async update(id: string, dto: UpdateChapterDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const existingChapter = await this.chaptersRepository.findById(id);
    if (!existingChapter) throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);

    let slug = existingChapter.slug;
    if (dto.title && dto.title !== existingChapter.title) {
      const baseSlug = dto.slug?.trim() || slugify(dto.title);
      slug = await this.generateUniqueSlug(
        existingChapter.bookId,
        baseSlug,
        id,
      );
    }

    const chapterWithBook = await this.chaptersRepository.findById(id, 'bookId');
    if (chapterWithBook && chapterWithBook.bookId) {
      const book = await this.booksRepository.findById(chapterWithBook.bookId.toString());
      if (book) {
        await Promise.all([
          this.cacheService.del(`chapter:slug:${book.slug}:${existingChapter.slug}`),
          this.cacheService.del(`chapter:slug:${book.slug}:${slug}`)
        ]);
      }
    }

    const updatedChapter = await this.chaptersRepository.findById(id, 'bookId');
    return new ChapterModal(updatedChapter!);
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const chapter = await this.chaptersRepository.findById(id);
    if (!chapter) throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);

    await this.chaptersRepository.delete(id);

    const book = await this.booksRepository.findById(chapter.bookId.toString());
    if (book) {
      await this.cacheService.del(`chapter:slug:${book.slug}:${chapter.slug}`);
    }

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
      const exists = await this.chaptersRepository.existsBySlug(bookId, slug, excludeId);
      if (!exists) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}
