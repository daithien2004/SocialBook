// src/modules/library/library.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ReadingList,
  ReadingListDocument,
  ReadingStatus,
} from './schemas/reading-list.schema';
import {
  Progress,
  ProgressDocument,
} from '../progress/schemas/progress.schema';
import { UpdateProgressDto, AddToCollectionsDto } from './dto/library.dto';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  // 1. Lấy danh sách sách theo trạng thái (3 Tab Hệ Thống)
  // status = 'READING' | 'PLAN_TO_READ' | 'ARCHIVED'
  async getSystemLibrary(userId: string, status: ReadingStatus) {
    return this.readingListModel
      .find({ userId, status })
      .populate('bookId', 'title coverUrl authorId slug') // Populate info sách
      .populate('lastReadChapterId', 'title slug orderIndex') // Populate info chương đang đọc dở
      .sort({ updatedAt: -1 }) // Mới đọc lên đầu
      .lean();
  }

  // 2. Thêm sách vào thư viện (Mặc định là PLAN_TO_READ)
  // Hoặc chuyển trạng thái (VD: Bấm nút "Lưu trữ")
  async updateStatus(userId: string, bookId: string, status: ReadingStatus) {
    return this.readingListModel.findOneAndUpdate(
      { userId, bookId },
      {
        userId,
        bookId,
        status,
      },
      { upsert: true, new: true }, // Nếu chưa có thì tạo mới
    );
  }

  // 3. [QUAN TRỌNG] Update tiến độ đọc
  // Hàm này gọi khi user đọc truyện -> Tự động chuyển status sang READING
  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const { bookId, chapterId, progress } = dto;

    // A. Lưu chi tiết vào bảng Progress (để resume scroll)
    await this.progressModel.findOneAndUpdate(
      { userId, chapterId },
      {
        userId,
        bookId,
        chapterId,
        progress: progress || 0,
        lastReadAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // B. Cập nhật bảng ReadingList (Master)
    // Để sách nhảy lên đầu tab "Đọc hiện tại"
    return this.readingListModel.findOneAndUpdate(
      { userId, bookId },
      {
        userId,
        bookId,
        status: ReadingStatus.READING, // Ép về trạng thái đang đọc
        lastReadChapterId: chapterId, // Pointer chương mới nhất
      },
      { upsert: true, new: true },
    );
  }

  // 4. Quản lý Folder cho sách
  // User tick chọn folder A, B cho sách X
  async updateBookCollections(userId: string, dto: AddToCollectionsDto) {
    const { bookId, collectionIds } = dto;

    // Cần đảm bảo sách đã có trong thư viện rồi mới add vào folder được
    // Nếu chưa có thì tạo mới với status mặc định
    return this.readingListModel.findOneAndUpdate(
      { userId, bookId },
      {
        $set: { collectionIds: collectionIds }, // Thay thế mảng cũ bằng mảng mới
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async getChapterProgress(userId: string, bookId: string, chapterId: string) {
    const progress = await this.progressModel
      .findOne({ userId, chapterId, bookId })
      .select('progress')
      .lean();

    return {
      progress: progress?.progress || 0,
    };
  }

  // 5. Xóa sách khỏi thư viện
  async removeFromLibrary(userId: string, bookId: string) {
    // Xóa trong reading list
    await this.readingListModel.deleteOne({ userId, bookId });

    // Tùy chọn: Có xóa luôn lịch sử đọc (Progress) không?
    // Thường là giữ lại Progress để sau này đọc lại vẫn nhớ
    return { success: true };
  }
}
