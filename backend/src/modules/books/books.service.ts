import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { Chapter, ChapterDocument } from '../chapters/schemas/chapter.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Author, AuthorDocument } from '../authors/schemas/author.schema';
import { Genre, GenreDocument } from '../genres/schemas/genre.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}

  async findBySlug(slug: string) {
    // VALIDATION
    if (!slug) {
      throw new BadRequestException('Book slug is required');
    }

    // EXECUTION
    const book = await this.bookModel
      .findOne({ slug: slug })
      .populate('authorId', 'username email')
      .populate('genre', 'name slug')
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with slug "${slug}" not found`);
    }

    const chapters = await this.chapterModel
      .find({ bookId: book._id })
      .sort({ orderIndex: 1 })
      .lean();

    const comments = await this.commentModel
      .find({ targetType: 'book', targetId: book._id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // RETURN
    return {
      id: book._id,
      title: book.title,
      slug: book.slug,
      description: book.description,
      coverUrl: book.coverUrl,
      status: book.status,
      tags: book.tags,
      views: book.views,
      likes: book.likes,
      publishedYear: book.publishedYear,
      author: book.authorId,
      genres: book.genre,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      chapters,
      comments,
    };
  }

  async getBooks() {
    // EXECUTION
    const books = await this.bookModel
      .find({ isDeleted: false })
      .populate('authorId', 'username email')
      .populate('genre', 'name slug')
      .select(
        'title slug description coverUrl status tags views likes publishedYear createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .lean();

    // RETURN
    return {
      total: books.length,
      books: books.map((book) => ({
        id: book._id,
        title: book.title,
        slug: book.slug,
        description: book.description,
        coverUrl: book.coverUrl,
        status: book.status,
        tags: book.tags,
        views: book.views,
        likes: book.likes,
        publishedYear: book.publishedYear,
        author: book.authorId,
        genres: book.genre,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      })),
    };
  }

  /**
   * Lấy thông tin chi tiết 1 book theo ID
   */
  async getBookById(id: string) {
    // VALIDATION
    if (!id) {
      throw new BadRequestException('Book ID is required');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid book ID format');
    }

    // EXECUTION
    const book = await this.bookModel
      .findOne({ _id: id })
      .populate('authorId', 'username email')
      .populate('genre', 'name slug')
      .lean();

    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }

    const chapters = await this.chapterModel
      .find({ bookId: book._id })
      .sort({ orderIndex: 1 })
      .lean();

    const comments = await this.commentModel
      .find({ targetType: 'book', targetId: book._id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // RETURN
    return {
      id: book._id,
      title: book.title,
      slug: book.slug,
      description: book.description,
      coverUrl: book.coverUrl,
      status: book.status,
      tags: book.tags,
      views: book.views,
      likes: book.likes,
      publishedYear: book.publishedYear,
      author: book.authorId,
      genres: book.genre,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      chapters,
      comments,
    };
  }
}
