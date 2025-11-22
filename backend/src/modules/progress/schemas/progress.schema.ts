// src/modules/progress/schemas/progress.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProgressDocument = HydratedDocument<Progress>;

@Schema({ timestamps: true, collection: 'progresses' })
export class Progress {
  // 1. Định danh
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // 2. Book ID (Rất quan trọng: Để query xóa toàn bộ lịch sử của 1 sách nhanh chóng)
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  // 3. Chapter ID (Đang lưu progress của chương nào)
  @Prop({ type: Types.ObjectId, ref: 'Chapter', required: true })
  chapterId: Types.ObjectId;

  // 4. Dữ liệu Progress
  @Prop({ default: 0 })
  progress: number; // Lưu % (vd: 85.5) hoặc pixel offset (vd: 1200)

  @Prop({ default: 0 })
  timeSpent: number; // Thời gian đọc chương này (giây) - Dùng cho Analytics

  @Prop({ type: String, enum: ['reading', 'completed'], default: 'reading' })
  status: string; // Trạng thái riêng của chương này (đã đọc xong chưa)

  @Prop({ type: Date, default: Date.now })
  lastReadAt: Date;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);

// INDEX: Mỗi User chỉ có 1 record progress cho 1 Chapter
ProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

// Virtual id
ProgressSchema.virtual('id').get(function () {
  return this._id.toString();
});
