import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IBookmarkRepository } from '@/domain/bookmarks/repositories/bookmark.repository.interface';
import { Bookmark as BookmarkEntity } from '@/domain/bookmarks/entities/bookmark.entity';
import { Bookmark, BookmarkDocument } from '../../schemas/bookmark.schema';
import { BookmarkMapper } from './bookmark.mapper';

@Injectable()
export class MongooseBookmarkRepository implements IBookmarkRepository {
  constructor(
    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<BookmarkDocument>,
  ) {}

  async save(bookmark: BookmarkEntity): Promise<void> {
    const persistence = BookmarkMapper.toPersistence(bookmark);
    await this.bookmarkModel.updateOne(
      { _id: persistence._id },
      { $set: persistence },
      { upsert: true },
    );
  }

  async findById(id: string): Promise<BookmarkEntity | null> {
    const doc = await this.bookmarkModel
      .findById(new Types.ObjectId(id))
      .exec();
    return doc ? BookmarkMapper.toDomain(doc) : null;
  }

  async findByParagraph(
    userId: string,
    paragraphId: string,
  ): Promise<BookmarkEntity | null> {
    const doc = await this.bookmarkModel
      .findOne({
        userId: new Types.ObjectId(userId),
        paragraphId,
      })
      .exec();
    return doc ? BookmarkMapper.toDomain(doc) : null;
  }

  async findByBook(userId: string, bookId: string): Promise<BookmarkEntity[]> {
    const docs = await this.bookmarkModel
      .find({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => BookmarkMapper.toDomain(doc));
  }

  async deleteById(id: string): Promise<void> {
    await this.bookmarkModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
  }

  async deleteByParagraph(userId: string, paragraphId: string): Promise<void> {
    await this.bookmarkModel
      .deleteOne({
        userId: new Types.ObjectId(userId),
        paragraphId,
      })
      .exec();
  }
}
