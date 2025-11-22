// src/modules/library/schemas/reading-list.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReadingListDocument = HydratedDocument<ReadingList>;

// Định nghĩa Enum cho trạng thái để tránh gõ sai string
export enum ReadingStatus {
  READING = 'READING', // Đang đọc (Tab: Đọc hiện tại)
  PLAN_TO_READ = 'PLAN_TO_READ', // Muốn đọc (Tab: Danh sách đọc)
  ARCHIVED = 'ARCHIVED', // Lưu trữ (Tab: Kho lưu trữ)
  COMPLETED = 'COMPLETED', // Đã xong (Có thể gộp vào Archived tùy logic)
}

@Schema({ timestamps: true, collection: 'reading_lists' })
export class ReadingList {
  // 1. Liên kết User
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // 2. Liên kết Sách
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;

  // 1. TRẠNG THÁI CỨNG (Hệ thống dùng để sort logic)
  @Prop({
    type: String,
    enum: ReadingStatus,
    default: ReadingStatus.PLAN_TO_READ,
  })
  status: ReadingStatus;

  // 4. Pointer quan trọng: Chương đang đọc dở
  // Giúp nút "Đọc tiếp" ở ngoài giao diện biết đường dẫn ngay lập tức
  @Prop({ type: Types.ObjectId, ref: 'Chapter', default: null })
  lastReadChapterId: Types.ObjectId;

  // 2. FOLDER NGƯỜI DÙNG (User tự quản lý)
  // Một sách có thể nằm trong nhiều Folder (Dạng mảng)
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Collection' }],
    default: [],
  })
  collectionIds: Types.ObjectId[];
}

export const ReadingListSchema = SchemaFactory.createForClass(ReadingList);

// INDEX: Đảm bảo 1 User chỉ add 1 Book vào thư viện 1 lần duy nhất
ReadingListSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// INDEX: Giúp query lấy danh sách theo status nhanh (VD: Lấy tất cả sách đang đọc)
ReadingListSchema.index({ userId: 1, status: 1, updatedAt: -1 });

// Virtual id để frontend dễ dùng
ReadingListSchema.virtual('id').get(function () {
  return this._id.toString();
});
