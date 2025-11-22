// src/modules/library/collections.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import {
  ReadingList,
  ReadingListDocument,
} from './schemas/reading-list.schema';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private collectionModel: Model<CollectionDocument>,
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
  ) {}

  // 1. Tạo Folder mới
  async create(userId: string, dto: CreateCollectionDto) {
    try {
      const newCollection = await this.collectionModel.create({
        ...dto,
        userId,
      });
      return newCollection;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Bạn đã có folder tên này rồi');
      }
      throw error;
    }
  }

  // 2. Lấy danh sách Folder của user
  async findAll(userId: string) {
    return this.collectionModel.find({ userId }).sort({ createdAt: -1 });
  }

  // 3. Lấy chi tiết Folder + List Sách bên trong
  async findOneWithBooks(userId: string, collectionId: string) {
    // A. Lấy thông tin folder
    const collection = await this.collectionModel.findOne({
      _id: collectionId,
      userId,
    });
    if (!collection) throw new NotFoundException('Folder không tồn tại');

    // B. Lấy danh sách sách thuộc folder này từ bảng ReadingList
    const books = await this.readingListModel
      .find({
        userId,
        collectionIds: collectionId, // Query mảng
      })
      .populate('bookId', 'title coverUrl authorId slug status')
      .populate('lastReadChapterId', 'title slug orderIndex')
      .sort({ updatedAt: -1 });

    return {
      folder: collection,
      books: books,
    };
  }

  // 4. Sửa tên Folder
  async update(userId: string, collectionId: string, dto: UpdateCollectionDto) {
    const updated = await this.collectionModel.findOneAndUpdate(
      { _id: collectionId, userId },
      dto,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Không tìm thấy folder');
    return updated;
  }

  // 5. Xóa Folder
  async remove(userId: string, collectionId: string) {
    const deleted = await this.collectionModel.findOneAndDelete({
      _id: collectionId,
      userId,
    });
    if (!deleted) throw new NotFoundException('Không tìm thấy folder');

    // QUAN TRỌNG: Phải xóa ID folder này khỏi mảng collectionIds của các sách liên quan
    // Để tránh data rác
    await this.readingListModel.updateMany(
      { userId, collectionIds: collectionId },
      { $pull: { collectionIds: collectionId } },
    );

    return { success: true };
  }
}
