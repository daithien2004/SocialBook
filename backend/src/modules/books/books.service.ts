import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) { }

  async findBySlug(slug: string) {
    const book = await this.bookModel
      .findOne({ slug, isDeleted: false })
      .populate('authorId')
      .populate('genre')
      .lean();

    if (!book) {
      throw new NotFoundException('Book not found');
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

    return {
      ...book,
      author: book.authorId,
      genres: book.genre,
      chapters,
      comments,
    };
  }
}
